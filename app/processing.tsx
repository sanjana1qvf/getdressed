import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { openaiService } from '../services/ai/openai';

const loadingMessages = [
  "Analyzing your outfit style...",
  "Checking color coordination...",
  "Evaluating fit and proportions...",
  "Assessing overall aesthetic...",
  "Generating your fashion rating...",
];

export default function ProcessingScreen() {
  const params = useLocalSearchParams();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const imageBase64 = params.imageBase64 as string;
    if (!imageBase64) {
      setError('No image provided');
      return;
    }

    // Start the analysis process
    analyzeOutfit(imageBase64);
  }, [params.imageBase64]);

  useEffect(() => {
    // Rotate through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.9) return prev;
        return prev + 0.1;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const analyzeOutfit = async (imageBase64: string) => {
    try {
      console.log('Starting AI analysis...');
      
      const { analysis, error: analysisError } = await openaiService.analyzeOutfit(imageBase64);

      if (analysisError || !analysis) {
        console.error('AI analysis failed:', analysisError);
        
        // Check if it's a "no outfit detected" error
        if (analysisError && (
          analysisError.toLowerCase().includes('no outfit detected') ||
          analysisError.toLowerCase().includes('no clothing') ||
          analysisError.toLowerCase().includes('clear photo') ||
          analysisError.toLowerCase().includes('outfit') ||
          analysisError.toLowerCase().includes('clothing')
        )) {
          // Navigate to the no outfit detected screen
          router.replace('/no-outfit');
          return;
        }
        
        setError(analysisError || 'Failed to analyze outfit');
        return;
      }

      console.log('AI analysis successful:', analysis);
      
      // Complete the progress
      setProgress(1.0);

      // Navigate to result screen with the analysis
      router.replace({
        pathname: '/result',
        params: { 
          rating: analysis.rating.toString(),
          occasion: analysis.occasion,
          suggestions: JSON.stringify(analysis.suggestions),
          feedback: analysis.feedback
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setError('An unexpected error occurred');
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surface]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.errorTitle}>
              Analysis Failed
            </Text>
            <Text variant="bodyLarge" style={styles.errorMessage}>
              {error}
            </Text>
            <Text variant="bodyMedium" style={styles.retryText}>
              Please try again with a different image
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🤖</Text>
          </View>
          
          <Text variant="headlineMedium" style={styles.title}>
            AI Analysis in Progress
          </Text>
          
          <Text variant="bodyLarge" style={styles.message}>
            {loadingMessages[currentMessageIndex]}
          </Text>
          
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {Math.round(progress * 100)}% Complete
            </Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <Text variant="bodySmall" style={styles.tipsTitle}>
              💡 What we're analyzing:
            </Text>
            <Text variant="bodySmall" style={styles.tipsText}>
              • Outfit style and coordination
            </Text>
            <Text variant="bodySmall" style={styles.tipsText}>
              • Color harmony and balance
            </Text>
            <Text variant="bodySmall" style={styles.tipsText}>
              • Overall fashion rating (1-10)
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  errorTitle: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessage: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  retryText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
 