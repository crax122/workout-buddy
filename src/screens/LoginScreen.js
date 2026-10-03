import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Authentication Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Buddy</Text>
      
      <Text style={styles.subtitle}>{isLogin ? 'Login to Sync' : 'Create an Account'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleAuth}>
        <Text style={styles.btnTxt}>{isLogin ? 'LOGIN' : 'REGISTER'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
        <Text style={styles.toggleTxt}>
          {isLogin ? "Don't have an account? Register here." : "Already have an account? Login here."}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1b2a47', justifyContent: 'center', padding: 30 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#0bc0af', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 20, fontSize: 20 },
  btn: { backgroundColor: '#0bc0af', padding: 20, borderRadius: 15, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  toggleTxt: { color: '#bbb', textAlign: 'center', fontSize: 18 }
});
