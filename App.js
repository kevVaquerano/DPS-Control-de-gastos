import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/api/firebaseConfig';

// Importamos tus pantallas (asegúrate de que existan los archivos)
import LoginScreen from './src/screens/Auth/LoginScreen';
import DashboardScreen from './src/screens/Home/DashboardScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Escuchamos si el usuario entra o sale
      const unsubscribe = onAuthStateChanged(auth, (userExist) => {
        setUser(userExist);
        setLoading(false);
      }, (err) => {
        console.error("Error en Auth:", err);
        setError(err.message);
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  // 1. Pantalla de Carga
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.statusText}>Iniciando AppGastos...</Text>
      </View>
    );
  }

  // 2. Pantalla de Error (por si Firebase falla)
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: '#450a0a' }]}>
        <Text style={styles.title}>❌ Error de Conexión</Text>
        <Text style={styles.statusText}>{error}</Text>
      </View>
    );
  }

  // 3. Lógica de Navegación
  // Si hay usuario, vamos al Dashboard. Si no, al Login.
  return (
    <View style={styles.container}>
      {user ? <DashboardScreen /> : <LoginScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    ...(Platform.OS === 'web' ? { height: '100vh' } : {}),
  },
  center: {
    flex: 1,
    ...(Platform.OS === 'web' ? { height: '100vh' } : {}),
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    color: '#94a3b8',
    marginTop: 15,
    fontSize: 16,
  },
});