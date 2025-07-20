import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { theme } from '../styles/theme';

export default function DebugScreen() {
  const navigateToTabs = () => {
    console.log('Navigating to main app...');
    router.push('/');
  };

  const navigateToAuth = () => {
    console.log('Navigating to auth...');
    router.push('/(auth)/login');
  };

  const navigateToWelcome = () => {
    console.log('Navigating to welcome...');
    router.push('/');
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.content} elevation={0}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Debug Screen
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Test navigation routes
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={navigateToTabs}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Go to Tabs
          </Button>
          
          <Button
            mode="outlined"
            onPress={navigateToAuth}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Go to Auth
          </Button>
          
          <Button
            mode="outlined"
            onPress={navigateToWelcome}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Go to Welcome
          </Button>
        </View>

        <View style={styles.infoContainer}>
          <Text variant="titleMedium" style={styles.infoTitle}>
            Current Route Info:
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            This screen helps debug navigation issues.
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Check the console for navigation logs.
          </Text>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.onBackground,
    opacity: 0.8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  infoText: {
    color: theme.colors.onBackground,
    opacity: 0.8,
    marginBottom: 4,
  },
}); 