// ======================================================
// RegisterScreen.js
// Pantalla encargada del registro de usuarios.
// Permite registrarse con correo/contraseña o con Google.
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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { auth } from '../../api/firebaseConfig';

// Completa la sesión de autenticación cuando se usa Google en Expo.
WebBrowser.maybeCompleteAuthSession();

// ID de cliente web generado desde Firebase/Google Cloud.
// Se utiliza para iniciar sesión o registrarse con Google.
const WEB_CLIENT_ID =
  '423141717333-3sbmiaoepgeqiiv8v4g60j29nvfv9aa9.apps.googleusercontent.com';

// Mensajes personalizados para errores comunes de Firebase.
// Esto evita mostrar errores técnicos al usuario.
const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Este correo ya está registrado.',
  'auth/invalid-email': 'Correo electrónico inválido.',
  'auth/weak-password': 'La contraseña es demasiado débil.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
};

// Función reutilizable para mostrar alertas.
// En web se usa alert(), y en móvil se usa Alert.alert().
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function RegisterScreen({ navigation }) {
  // Detecta el ancho de la pantalla para adaptar el diseño.
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Estados del formulario de registro.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de carga para evitar múltiples clics mientras se procesa.
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configuración de Google Auth Session para móvil.
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
  });

  // Valida si el botón de Google debe estar deshabilitado.
  const isGoogleDisabled = googleLoading || (!request && Platform.OS !== 'web');

  // Maneja la respuesta de Google en móvil.
  // En web se usa signInWithPopup, por eso aquí se excluye Platform.OS === 'web'.
  useEffect(() => {
    const registerWithGoogleNative = async () => {
      if (response?.type !== 'success' || Platform.OS === 'web') return;

      setGoogleLoading(true);

      try {
        // Se obtiene el token de Google y se convierte en credencial Firebase.
        const credential = GoogleAuthProvider.credential(response.params.id_token);

        // Firebase registra o inicia sesión con esa cuenta de Google.
        await signInWithCredential(auth, credential);
      } catch (error) {
        showAlert('Error con Google', error.message);
      } finally {
        setGoogleLoading(false);
      }
    };

    registerWithGoogleNative();
  }, [response]);

  // Valida los campos antes de crear la cuenta.
  const validateForm = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password || !confirmPassword) {
      showAlert('Campos requeridos', 'Por favor completa todos los campos.');
      return false;
    }

    if (!cleanEmail.includes('@')) {
      showAlert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }

    if (password.length < 6) {
      showAlert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden.');
      return false;
    }

    return true;
  };

  // Registra al usuario usando correo y contraseña.
  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      showAlert(
        'Error al registrarse',
        AUTH_ERROR_MESSAGES[error.code] || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Registra o inicia sesión con Google.
  // Firebase permite que si la cuenta ya existe, entre directamente.
  const handleGoogleRegister = async () => {
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
      // En móvil, el loading se apaga cuando llega la respuesta de Google.
      if (Platform.OS === 'web') setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: isDesktop ? 900 : '100%' }]}>
          {/* Encabezado de la pantalla */}
          <View style={styles.header}>
            <Text style={styles.emoji}>📝</Text>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar</Text>
          </View>

          {/* Formulario principal */}
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
              placeholder="Contraseña (mín. 6 caracteres)"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* Botón de registro con correo */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryButtonText}>Registrarme</Text>
              )}
            </TouchableOpacity>

            {/* Separador visual entre registro normal y Google */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón de registro con Google */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleDisabled && styles.disabled]}
              onPress={handleGoogleRegister}
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
                  <Text style={styles.googleText}>Registrarme con Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Enlace para volver al login */}
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ======================================================
// Estilos de la pantalla Register.
// Se agrupan por secciones visuales: pantalla, encabezado,
// formulario, botones, separador y enlace.
// ======================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  content: {
    maxWidth: 900,
    alignSelf: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },

  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 6,
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