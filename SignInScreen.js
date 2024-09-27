import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { auth } from './Firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import { KeyboardAvoidingView, Platform } from 'react-native';

const SignInScreen = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSignIn(email);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onSignIn(email);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome to spinestock</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          //debug
          onFocus={() => console.log('Email input focused')}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          //debug
          onFocus={() => console.log('Password input focused')}
        />
        {isSigningUp ? (
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsSigningUp(!isSigningUp)}
        >
          <Text style={styles.toggleButtonText}>
            {isSigningUp ? 'Already have an account?' : 'Create a new account'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#343b45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    marginBottom: 20,
  },
  buttonText: {
    color: '#343b45',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleButton: {
    marginTop: 10,
  },
  toggleButtonText: {
    color: 'white',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;