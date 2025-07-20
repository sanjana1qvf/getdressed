import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { analyzeOutfitWithAI } from '../services/ai/openai';
import { outfitsService } from '../services/supabase/outfits';
import { authService } from '../services/supabase/auth';
import { storageService } from '../services/supabase/storage';
import { supabase, testSupabaseConnection } from '../config/supabase';
import { ERROR_MESSAGES, NETWORK_CONFIG, checkNetworkConnectivity, checkSupabaseConnection } from '../utils/constants';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY } from '@env';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with margins

interface Outfit {
  id: string;
  image_url: string;
  title: string;
  date: string;
  size: string;
  analysis?: {
    overallRating: number;
    feedback: string;
    suggestions: string[];
    occasion: string;
    timestamp: string;
  };
}

export default function UploadScreen() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<Outfit | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Check authentication and load saved outfits on component mount
  useEffect(() => {
    checkAuthAndLoadOutfits();
  }, []);

  // Start rotation animation when modal is visible
  useEffect(() => {
    if (analysisModalVisible) {
      const startRotation = () => {
        rotateAnim.setValue(0);
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => startRotation());
      };
      startRotation();
    }
  }, [analysisModalVisible, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const checkAuthAndLoadOutfits = async () => {
    try {
      // Check if user is authenticated
      const { user, error } = await authService.getCurrentUser();
      
      if (error || !user) {
        // User not authenticated, redirect to login
        router.replace('/login');
        return;
      }

      setCurrentUser(user);
      
      // Test Supabase connection
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.warn('Supabase connection test failed');
      }
      
      // Try to load outfits from cloud storage
      try {
        const { outfits: cloudOutfits, error: outfitsError } = await outfitsService.getUserOutfits(user.id);
        
        if (outfitsError) {
          console.error('Error loading outfits:', outfitsError);
          
          // If it's a database table error, show setup message
          if (outfitsError.includes('relation') && outfitsError.includes('does not exist')) {
            showSnackbar('Database not set up. Please run the setup script in Supabase.');
            // Continue with empty outfits array
            setOutfits([]);
            return;
          }
          
          showSnackbar('Failed to load outfits');
          setOutfits([]);
          return;
        }

        if (cloudOutfits) {
          // Transform cloud outfits to match local format
          const transformedOutfits = cloudOutfits.map(outfit => ({
            id: outfit.id,
            image_url: outfit.image_url,
            title: `Outfit ${outfit.id}`,
            date: new Date(outfit.created_at).toLocaleDateString(),
            size: `${Math.round(Math.random() * 50 + 20)} MB`,
            analysis: {
              overallRating: outfit.rating || 0,
              feedback: outfit.feedback || '',
              suggestions: outfit.suggestions || [],
              occasion: outfit.occasion || 'Unknown',
              timestamp: outfit.created_at,
            }
          }));
          
          setOutfits(transformedOutfits);
          console.log('Loaded outfits from cloud:', transformedOutfits.length);
        }
      } catch (cloudError) {
        console.error('Cloud storage error:', cloudError);
        
        // If it's a database setup issue, show helpful message
        if (cloudError.message && cloudError.message.includes('relation')) {
          showSnackbar('Database setup required. Check SETUP.md for instructions.');
        } else {
          showSnackbar('Failed to load outfits from cloud');
        }
        
        // Continue with empty outfits array
        setOutfits([]);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/login');
    }
  };

  const checkConnectivity = async (): Promise<boolean> => {
    // Check network connectivity
    const isNetworkConnected = await checkNetworkConnectivity();
    if (!isNetworkConnected) {
      showSnackbar('No internet connection. Please check your network and try again.');
      return false;
    }

    // Check Supabase connection
    const isSupabaseConnected = await checkSupabaseConnection();
    if (!isSupabaseConnected) {
      showSnackbar('Database connection failed. Please try again later.');
      return false;
    }

    return true;
  };

  const debugConfiguration = () => {
    console.log('=== Configuration Debug ===');
    console.log('Supabase URL:', EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Supabase Key:', EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    console.log('OpenAI Key:', OPENAI_API_KEY ? 'Set' : 'Missing');
    console.log('Current User:', currentUser?.id || 'None');
    console.log('Network Config:', NETWORK_CONFIG);
    console.log('==========================');
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Captured image URI:', result.assets[0].uri);
        // Start analysis immediately
        await analyzeAndAddOutfit(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showSnackbar('Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery permission is required to select photos',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Selected image URI:', result.assets[0].uri);
        // Start analysis immediately
        await analyzeAndAddOutfit(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showSnackbar('Failed to select image. Please try again.');
    }
  };

  const analyzeAndAddOutfit = async (imageUri: string) => {
    if (!currentUser) {
      showSnackbar('User not authenticated');
      return;
    }

    setLoading(true);
    setAnalyzingImage(imageUri);
    setAnalysisModalVisible(true);
    
    try {
      console.log('Starting analysis for URI:', imageUri);
      
      // Check connectivity before starting
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        setAnalysisModalVisible(false);
        setAnalyzingImage(null);
        return;
      }
      
      // Analyze with AI first
      const analysis = await analyzeOutfitWithAI(imageUri);
      
      console.log('Analysis completed:', analysis);
      
      // Convert image to blob for upload with better error handling
      let blob;
      try {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        blob = await response.blob();
        console.log('Image converted to blob, size:', blob.size);
      } catch (fetchError) {
        console.error('Error converting image to blob:', fetchError);
        throw new Error('Failed to process image for upload');
      }
      
      // Skip storage upload for now and save directly to database with local image URL
      console.log('Skipping storage upload, saving with local image URL...');
      
      const localImageUrl = imageUri; // Use local image URI instead of cloud storage

      console.log('Using local image URL for database save');
      
      // Save outfit to cloud database with retry logic
      console.log('Saving outfit to database...');
      let savedOutfit;
      let saveError;
      let retryCount = 0;
      const maxRetries = NETWORK_CONFIG.MAX_RETRIES;
      
      while (retryCount < maxRetries) {
        try {
          const result = await outfitsService.createOutfit(
            currentUser.id,
            localImageUrl,
            {
              rating: analysis.overallRating || 0,
              feedback: analysis.feedback || '',
              suggestions: analysis.suggestions || [],
              occasion: analysis.occasion || 'Unknown',
            }
          );
          
          savedOutfit = result.outfit;
          saveError = result.error;
          
          if (!saveError) {
            break; // Success, exit retry loop
          }
          
          console.log(`Database save attempt ${retryCount + 1} failed:`, saveError);
          
          // If it's a network error, retry
          if (saveError.includes('network') || 
              saveError.includes('fetch') ||
              saveError.includes('Network request failed')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying database save in ${NETWORK_CONFIG.RETRY_DELAY/1000} seconds... (${retryCount}/${maxRetries})`);
              showSnackbar(`${ERROR_MESSAGES.RETRY_MESSAGE} (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.RETRY_DELAY));
              continue;
            }
          } else {
            // Non-network error, don't retry
            break;
          }
        } catch (retryError) {
          console.error(`Database save attempt ${retryCount + 1} threw error:`, retryError);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying database save in ${NETWORK_CONFIG.RETRY_DELAY/1000} seconds... (${retryCount}/${maxRetries})`);
            showSnackbar(`${ERROR_MESSAGES.RETRY_MESSAGE} (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.RETRY_DELAY));
            continue;
          }
          saveError = retryError.message;
        }
      }

      if (saveError) {
        console.error('Error saving outfit after retries:', saveError);
        
        // Fallback: Save locally without database
        console.log('Attempting to save outfit locally as fallback...');
        const localOutfit: Outfit = {
          id: `local_${Date.now()}`,
          image_url: localImageUrl, // Use the local image URL
          title: `Outfit ${outfits.length + 1} (Local)`,
          date: new Date().toLocaleDateString(),
          size: `${Math.round(Math.random() * 50 + 20)} MB`,
          analysis: {
            overallRating: analysis.overallRating || 0,
            feedback: analysis.feedback || '',
            suggestions: analysis.suggestions || [],
            occasion: analysis.occasion || 'Unknown',
            timestamp: new Date().toISOString(),
          }
        };
        
        setOutfits([localOutfit, ...outfits]);
        showSnackbar('Outfit analyzed and saved locally! (Database sync failed)');
        
        setAnalysisModalVisible(false);
        setAnalyzingImage(null);
        
        // Navigate to result screen
        router.push({
          pathname: '/result',
          params: { 
            analysis: JSON.stringify(localOutfit.analysis),
            imageUri: localOutfit.image_url,
            outfitId: localOutfit.id
          }
        });
        
        return;
      }

      if (savedOutfit) {
        console.log('Outfit saved successfully:', savedOutfit);
        
        // Add to local state
        const newOutfit: Outfit = {
          id: savedOutfit.id,
          image_url: localImageUrl, // Use local image URL
          title: `Outfit ${outfits.length + 1}`,
          date: new Date().toLocaleDateString(),
          size: `${Math.round(Math.random() * 50 + 20)} MB`,
          analysis: {
            overallRating: savedOutfit.rating || 0,
            feedback: savedOutfit.feedback || '',
            suggestions: savedOutfit.suggestions || [],
            occasion: savedOutfit.occasion || 'Unknown',
            timestamp: savedOutfit.created_at,
          }
        };
        
        setOutfits([newOutfit, ...outfits]);
        showSnackbar('Outfit analyzed and saved to cloud!');
        
        // Close modal and navigate to result
        setAnalysisModalVisible(false);
        setAnalyzingImage(null);
        
        // Navigate to result screen
        router.push({
          pathname: '/result',
          params: { 
            analysis: JSON.stringify(newOutfit.analysis),
            imageUri: newOutfit.image_url,
            outfitId: newOutfit.id
          }
        });
      }
      
    } catch (error) {
      console.error('Error analyzing outfit:', error);
      let errorMessage = ERROR_MESSAGES.ANALYSIS_ERROR;
      
      if (error.message) {
        // Check if it's a "no outfit detected" error
        if (error.message.toLowerCase().includes('no outfit detected') ||
            error.message.toLowerCase().includes('no clothing') ||
            error.message.toLowerCase().includes('clear photo') ||
            error.message.toLowerCase().includes('outfit') ||
            error.message.toLowerCase().includes('clothing')) {
          // Navigate to the no outfit detected screen
          setAnalysisModalVisible(false);
          setAnalyzingImage(null);
          router.push('/no-outfit');
          return;
        }
        
        if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Network request failed')) {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message.includes('API')) {
          errorMessage = 'AI analysis service is temporarily unavailable.';
        } else if (error.message.includes('image')) {
          errorMessage = 'Unable to process image. Please try a different photo.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showSnackbar(errorMessage);
      setAnalysisModalVisible(false);
      setAnalyzingImage(null);
    } finally {
      setLoading(false);
    }
  };

  const viewOutfitDetails = (outfit: Outfit) => {
    if (outfit.analysis) {
      router.push({
        pathname: '/result',
        params: { 
          analysis: JSON.stringify(outfit.analysis),
          imageUri: outfit.image_url,
          outfitId: outfit.id
        }
      });
    } else {
      showSnackbar('No analysis available for this outfit');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleOutfitPress = (outfit: Outfit) => {
    setOutfitToDelete(outfit);
    setDeleteModalVisible(true);
  };

  const handleOutfitLongPress = (outfit: Outfit) => {
    viewOutfitDetails(outfit);
  };

  const confirmDelete = async () => {
    if (!outfitToDelete || !currentUser) return;
    
    try {
      // Delete from cloud database
      const { error: deleteError } = await outfitsService.deleteOutfit(outfitToDelete.id);
      
      if (deleteError) {
        console.error('Error deleting outfit from cloud:', deleteError);
        showSnackbar('Failed to delete outfit');
        return;
      }

      // Delete image from storage (extract filename from URL)
      const imageUrl = outfitToDelete.image_url;
      const fileName = imageUrl.split('/').pop(); // Get filename from URL
      
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('outfit-images')
          .remove([`outfits/${currentUser.id}/${fileName}`]);
        
        if (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Don't show error to user as the outfit was already deleted from DB
        }
      }

      // Update local state
      const updatedOutfits = outfits.filter(o => o.id !== outfitToDelete.id);
      setOutfits(updatedOutfits);
      showSnackbar('Outfit deleted successfully');
    } catch (error) {
      console.error('Error deleting outfit:', error);
      showSnackbar('Failed to delete outfit');
    } finally {
      setDeleteModalVisible(false);
      setOutfitToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setOutfitToDelete(null);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => {
          try {
            // Sign out from Supabase
            const { error } = await authService.signOut();
            
            if (error) {
              console.error('Error during logout:', error);
            }
            
            // Clear local storage
            await AsyncStorage.removeItem('user_token');
            await AsyncStorage.removeItem('user_email');
            
            // Navigate to login
            router.replace('/login');
          } catch (error) {
            console.error('Error during logout:', error);
            router.replace('/login');
          }
        } },
      ]
    );
  };

  const renderOutfitCard = (outfit: Outfit) => (
    <TouchableOpacity
      key={outfit.id}
      style={styles.outfitCard}
      onPress={() => handleOutfitPress(outfit)}
      onLongPress={() => handleOutfitLongPress(outfit)}
      disabled={loading}
    >
      <Image source={{ uri: outfit.image_url }} style={styles.outfitImage} />
      
      {/* Rating Badge */}
      {outfit.analysis && (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{outfit.analysis.overallRating.toFixed(1)}</Text>
        </View>
      )}
      
      <Text style={styles.outfitTitle}>{outfit.title}</Text>
      <Text style={styles.outfitMeta}>
        {outfit.date} · {outfit.size}
        {outfit.analysis && ` · ${outfit.analysis.overallRating.toFixed(1)}/10`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Outfits</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon} onPress={debugConfiguration}>
            <Text style={styles.iconText}>🔧</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
            <Text style={styles.iconText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {outfits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No outfits yet</Text>
            <Text style={styles.emptySubtitle}>Take a photo or select from gallery to get AI analysis</Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity style={styles.emptyCameraButton} onPress={takePhoto}>
                <Text style={styles.emptyButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyGalleryButton} onPress={pickImage}>
                <Text style={styles.emptyGalleryButtonText}>📁 Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.outfitsGrid}>
            {outfits.map(renderOutfitCard)}
          </View>
        )}
      </ScrollView>

      {/* Gallery Button (above camera) */}
      <TouchableOpacity 
        style={[styles.galleryFab, loading && styles.fabDisabled]} 
        onPress={pickImage}
        disabled={loading}
      >
        <Text style={styles.fabIcon}>📁</Text>
      </TouchableOpacity>

      {/* Camera Button */}
      <TouchableOpacity
        style={[styles.cameraFab, loading && styles.fabDisabled]}
        onPress={takePhoto}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.plusIcon}>+</Text>
      </TouchableOpacity>

      {/* Analysis Loading Modal */}
      <Modal
        visible={analysisModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Logo in center */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo_bg_removed.png')} 
                style={styles.centerLogo}
                resizeMode="contain"
              />
              
              {/* Circular loading bar around logo */}
              <View style={styles.circularLoader}>
                <Animated.View style={[styles.circularProgress, { transform: [{ rotate: spin }] }]} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Outfit?</Text>
            <Text style={styles.deleteModalText}>
              This action cannot be undone. The outfit and its analysis will be permanently removed.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDelete}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 20,
  },
  iconText: {
    fontSize: 24,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FABs
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  emptyCameraButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  emptyGalleryButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginLeft: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyGalleryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  outfitCard: {
    width: cardWidth,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outfitImage: {
    width: '100%',
    height: cardWidth,
    resizeMode: 'cover',
  },
  outfitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outfitMeta: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  cameraFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  galleryFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    position: 'relative',
  },
  centerLogo: {
    width: 60,
    height: 60,
    zIndex: 2,
  },
  circularLoader: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#000',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#000',
  },
  snackbar: {
    backgroundColor: '#000',
  },
  plusIcon: {
    fontSize: 30,
    color: '#fff',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 