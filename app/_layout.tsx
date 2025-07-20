import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../styles/theme';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after resources are loaded
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{ 
              title: 'GetDressed',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              title: 'Login',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="signup" 
            options={{ 
              title: 'Sign Up',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="upload" 
            options={{ 
              title: 'Upload',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="processing" 
            options={{ 
              title: 'Processing',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="result" 
            options={{ 
              title: 'Result',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="debug" 
            options={{ 
              title: 'Debug',
              headerShown: false 
            }} 
          />
        </Stack>
      </PaperProvider>
    </ErrorBoundary>
  );
} 