import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { auth } from '../../api/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      showAlert('Error', 'Por favor llena todos los campos');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      showAlert('Error de Login', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control de Gastos</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#ccc"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#ccc"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#4A90E2', 
    padding: 20,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}),
  },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { width: '100%', height: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 15, color: 'white', marginBottom: 15 },
  button: { width: '100%', height: 50, backgroundColor: 'white', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#4A90E2', fontSize: 18, fontWeight: 'bold' }
});