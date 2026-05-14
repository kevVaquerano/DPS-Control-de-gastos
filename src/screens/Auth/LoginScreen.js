// ======================================================
// LoginScreen.js
// Pantalla encargada del inicio de sesión.
// Permite entrar con correo/contraseña o con Google.
// ======================================================

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { auth } from '../../api/firebaseConfig';

// Finaliza correctamente la sesión cuando Google devuelve respuesta.
WebBrowser.maybeCompleteAuthSession();

// ID del cliente web para autenticación con Google.
const WEB_CLIENT_ID =
  '423141717333-3sbmiaoepgeqiiv8v4g60j29nvfv9aa9.apps.googleusercontent.com';

// Diccionario de errores comunes de Firebase.
// Permite mostrar mensajes más claros al usuario.
const AUTH_ERROR_MESSAGES = {
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-email': 'Correo electrónico inválido.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
};

// Función general para alertas.
// Se adapta dependiendo si la app corre en web o móvil.
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function LoginScreen({ navigation }) {
  // Detecta si la pantalla es tipo escritorio para adaptar tamaños.
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Estados del formulario de login.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para controlar carga de botones.
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Hook de Expo para autenticación con Google en móvil.
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
  });

  // Determina si el botón de Google debe bloquearse temporalmente.
  const isGoogleDisabled = googleLoading || (!request && Platform.OS !== 'web');

  // Procesa la respuesta de Google en móvil.
  // Cuando response.type es "success", Firebase recibe el token.
  useEffect(() => {
    const loginWithGoogleNative = async () => {
      if (response?.type !== 'success' || Platform.OS === 'web') return;

      setGoogleLoading(true);

      try {
        const credential = GoogleAuthProvider.credential(response.params.id_token);
        await signInWithCredential(auth, credential);
      } catch (error) {
        showAlert('Error con Google', error.message);
      } finally {
        setGoogleLoading(false);
      }
    };

    loginWithGoogleNative();
  }, [response]);

  // Valida los campos antes de intentar iniciar sesión.
  const validateForm = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password.trim()) {
      showAlert('Campos requeridos', 'Por favor completa todos los campos.');
      return false;
    }

    if (!cleanEmail.includes('@')) {
      showAlert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }

    return true;
  };

  // Inicia sesión usando correo y contraseña.
  const handleEmailLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      showAlert(
        'Error al iniciar sesión',
        AUTH_ERROR_MESSAGES[error.code] || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Inicia sesión con Google.
  // En web usa ventana emergente; en móvil usa promptAsync().
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return;
      }

      await promptAsync();
    } catch (error) {
      showAlert(
        'Error con Google',
        AUTH_ERROR_MESSAGES[error.code] || error.message
      );
    } finally {
      // En móvil el estado se actualiza al recibir la respuesta de Google.
      if (Platform.OS === 'web') setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: isDesktop ? 820 : '100%' }]}>
          {/* Encabezado de bienvenida */}
          <View style={styles.header}>
            <Text style={styles.emoji}>💰</Text>
            <Text style={[styles.title, { fontSize: isDesktop ? 34 : 28 }]}>
              Control de Gastos
            </Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          {/* Formulario de inicio de sesión */}
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

            {/* Botón para iniciar sesión con correo */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabled]}
              onPress={handleEmailLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Separador entre métodos de acceso */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón para iniciar sesión con Google */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleDisabled && styles.disabled]}
              onPress={handleGoogleLogin}
              disabled={isGoogleDisabled}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color="#f8fafc" />
              ) : (
                <>
                  <Image
                    source={require('../../images/GoogleIcon.png')}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleText}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Enlace hacia la pantalla de registro */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.link}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ======================================================
// Estilos de LoginScreen.
// Se organizaron con nombres descriptivos para evitar
// clases repetidas o estilos sin uso.
// ======================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  scroll: {
    width: '100%',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  content: {
    alignSelf: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 36,
  },

  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },

  title: {
    color: '#f8fafc',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 6,
    textAlign: 'center',
  },

  form: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },

  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 17.5,
  },

  primaryButton: {
    width: '100%',
    height: 52,
    marginTop: 4,
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#0f172a',
    fontSize: 16.7,
    fontWeight: '700',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },

  dividerText: {
    color: '#64748b',
    fontSize: 13,
  },

  googleButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  googleIcon: {
    width: 22,
    height: 22,
  },

  googleText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },

  linkText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 16,
  },

  link: {
    color: '#38bdf8',
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.5,
  },
});