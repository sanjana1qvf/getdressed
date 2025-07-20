import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function NoOutfitScreen() {
  const handleRetry = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>👕</Text>
          </View>
          
          <Text variant="headlineMedium" style={styles.title}>
            No Outfit Detected
          </Text>
          
          <Text variant="bodyLarge" style={styles.message}>
            We couldn't see any clothing in your photo. Please make sure to upload a clear photo where your outfit is completely visible.
          </Text>
          
          <View style={styles.tipsContainer}>
            <Text variant="titleMedium" style={styles.tipsTitle}>
              📸 Tips for better photos:
            </Text>
            <Text variant="bodyMedium" style={styles.tip}>
              • Stand in good lighting
            </Text>
            <Text variant="bodyMedium" style={styles.tip}>
              • Show your full outfit clearly
            </Text>
            <Text variant="bodyMedium" style={styles.tip}>
              • Avoid shadows or blurry images
            </Text>
            <Text variant="bodyMedium" style={styles.tip}>
              • Make sure clothing is the main focus
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={handleRetry}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Try Again
          </Button>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  tipsTitle: {
    color: '#000',
    fontWeight: '600',
    marginBottom: 15,
  },
  tip: {
    color: '#333',
    marginBottom: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
}); 