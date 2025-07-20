import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResultScreen() {
  const params = useLocalSearchParams();
  
  // Handle both old format and new stored analysis format
  let rating = 0;
  let feedback = 'Analysis completed';
  let suggestions: string[] = [];
  let occasion = 'Unknown';
  
  if (params.analysis) {
    try {
      const analysis = JSON.parse(params.analysis as string);
      rating = analysis.overallRating || 0;
      feedback = analysis.feedback || 'Analysis completed';
      suggestions = analysis.suggestions || [];
      occasion = analysis.occasion || 'Unknown';
    } catch (error) {
      console.error('Error parsing analysis:', error);
      // Fallback to old format
      rating = parseInt(params.rating as string) || 0;
      occasion = params.occasion as string || 'Unknown';
      suggestions = JSON.parse(params.suggestions as string || '[]');
      feedback = params.feedback as string || 'Analysis completed';
    }
  } else {
    // Old format fallback
    rating = parseInt(params.rating as string) || 0;
    occasion = params.occasion as string || 'Unknown';
    suggestions = JSON.parse(params.suggestions as string || '[]');
    feedback = params.feedback as string || 'Analysis completed';
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return '#4CAF50'; // Green for excellent
    if (rating >= 7) return '#8BC34A'; // Light green for good
    if (rating >= 5) return '#FFC107'; // Yellow for average
    if (rating >= 3) return '#FF9800'; // Orange for poor
    return '#F44336'; // Red for very poor
  };

  const getRatingEmoji = (rating: number) => {
    if (rating >= 9) return '🔥';
    if (rating >= 7) return '✨';
    if (rating >= 5) return '👍';
    if (rating >= 3) return '😐';
    return '😬';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 9) return 'Excellent!';
    if (rating >= 7) return 'Good Style!';
    if (rating >= 5) return 'Not Bad!';
    if (rating >= 3) return 'Needs Work';
    return 'Poor Style';
  };

  const handleNewAnalysis = () => {
    // Outfit is already saved, just go back to upload
    router.replace('/upload');
  };

  const handleBackToGallery = () => {
    // Outfit is already saved, go back to gallery
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Your Style Rating
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              AI-powered fashion analysis
            </Text>
          </View>

          {/* Rating Display */}
          <Card style={styles.ratingCard} elevation={4}>
            <LinearGradient
              colors={[getRatingColor(rating), getRatingColor(rating) + '80']}
              style={styles.ratingGradient}
            >
              <View style={styles.ratingContent}>
                <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}/10</Text>
                <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
              </View>
            </LinearGradient>
          </Card>

          {/* Occasion */}
          <Card style={styles.infoCard} elevation={4}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Perfect For
              </Text>
              <Chip
                mode="outlined"
                textStyle={styles.chipText}
                style={styles.occasionChip}
              >
                {occasion}
              </Chip>
            </Card.Content>
          </Card>

          {/* Feedback */}
          <Card style={styles.infoCard} elevation={4}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                AI Feedback
              </Text>
              <Text variant="bodyMedium" style={styles.feedbackText}>
                {feedback.split('\n').map((line, index) => (
                  <Text key={index} style={styles.feedbackLine}>
                    {line}
                    {index < feedback.split('\n').length - 1 && '\n'}
                  </Text>
                ))}
              </Text>
            </Card.Content>
          </Card>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Card style={styles.infoCard} elevation={4}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Style Suggestions
                </Text>
                {suggestions.map((suggestion: string, index: number) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text variant="bodyMedium" style={styles.suggestionText}>
                      {suggestion}
                    </Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleNewAnalysis}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Analyze Another Outfit
            </Button>
            <Button
              mode="outlined"
              onPress={handleBackToGallery}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Back to Gallery
            </Button>
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ratingGradient: {
    padding: 32,
  },
  ratingContent: {
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: theme.colors.primary,
    marginBottom: 12,
    fontWeight: '600',
  },
  occasionChip: {
    alignSelf: 'flex-start',
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  feedbackText: {
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  feedbackLine: {
    color: theme.colors.onSurface,
    lineHeight: 22,
    marginBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    color: theme.colors.primary,
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    color: theme.colors.onSurface,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 24,
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    borderRadius: 16,
    borderColor: theme.colors.outline,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 