import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, Alert, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../api/firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// poner el client id de google que sale en firebase
const WEB_CLIENT_ID = '423141717333-3sbmiaoepgeqiiv8v4g60j29nvfv9aa9.apps.googleusercontent.com';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const handleGoogle = async () => {
        setGoogleLoading(true);
        try {
          const { id_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);
        } catch (error) {
          showAlert('Error con Google', error.message);
        } finally {
          setGoogleLoading(false);
        }
      };
      handleGoogle();
    }
  }, [response]);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    if (!email.includes('@')) {
      showAlert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const messages = {
        'auth/user-not-found': 'No existe una cuenta con este correo.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'Correo electrónico inválido.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
      };
      showAlert('Error al iniciar sesión', messages[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.title}>Control de Gastos</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f172a" />
              : <Text style={styles.buttonText}>Iniciar Sesión</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, (googleLoading || !request) && styles.disabled]}
            onPress={() => promptAsync()}
            disabled={!request || googleLoading}
          >
            {googleLoading
              ? <ActivityIndicator color="#f8fafc" />
              : (
                <>
                  <Text style={styles.googleLetter}>G</Text>
                  <Text style={styles.googleText}>Continuar con Google</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            ¿No tienes cuenta? <Text style={styles.link}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a', width: '100%' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%' },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 15, marginTop: 6 },
  form: { gap: 12, marginBottom: 28 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', fontSize: 13 },
  googleButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  googleLetter: { color: '#ea4335', fontSize: 20, fontWeight: 'bold' },
  googleText: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#64748b', textAlign: 'center', fontSize: 14 },
  link: { color: '#38bdf8', fontWeight: '600' },
});
