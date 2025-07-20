import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  useEffect(() => {
    console.log('Welcome screen mounted');
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSignUp}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Get Started
          </Button>
          
          <Button
            mode="text"
            onPress={handleLogin}
            style={styles.textButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.textButtonLabel}
          >
            I already have an account
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    alignSelf: 'center',
  },
  primaryButton: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  textButton: {
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  textButtonLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
}); 