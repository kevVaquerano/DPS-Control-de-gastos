// ======================================================
// App.js
// Archivo principal de la aplicación.
// Controla el estado de autenticación y maneja una navegación
// manual simple para conservar el comportamiento del scroll
// en escritorio.
// ======================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/api/firebaseConfig';

import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import DashboardScreen from './src/screens/Home/DashboardScreen';
import AddExpenseScreen from './src/screens/Expenses/AddExpenseScreen';
import HistoryScreen from './src/screens/Expenses/HistoryScreen';

// Pantallas disponibles cuando el usuario no ha iniciado sesión.
const PUBLIC_SCREENS = {
  Login: LoginScreen,
  Register: RegisterScreen,
};

// Pantallas disponibles cuando el usuario ya inició sesión.
const PRIVATE_SCREENS = {
  Dashboard: DashboardScreen,
  AddExpense: AddExpenseScreen,
  History: HistoryScreen,
};

export default function App() {
  // Guarda el usuario autenticado.
  // Si user es null, se muestran las pantallas públicas.
  const [user, setUser] = useState(null);

  // Controla la pantalla de carga inicial mientras Firebase valida la sesión.
  const [loading, setLoading] = useState(true);

  // Guarda el nombre de la pantalla actual.
  const [currentScreen, setCurrentScreen] = useState('Login');

  // Fuerza el remontaje de la pantalla al navegar.
  // Se conserva porque ayuda a refrescar vistas y mantener comportamiento visual.
  const [navKey, setNavKey] = useState(0);

  // Guarda el historial de pantallas para poder usar goBack().
  // useRef evita renders innecesarios al modificar el historial.
  const historyRef = useRef([]);

  // Escucha cambios en la sesión del usuario.
  // Se ejecuta al iniciar la app, iniciar sesión o cerrar sesión.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          setCurrentScreen('Dashboard');
        } else {
          setCurrentScreen('Login');
          historyRef.current = [];
        }

        setNavKey((key) => key + 1);
        setLoading(false);
      },
      (error) => {
        console.error('Error de autenticación:', error);
        setLoading(false);
      }
    );

    // Limpia el listener de Firebase al desmontar el componente.
    return unsubscribe;
  }, []);

  // Cambia de pantalla y guarda la pantalla anterior en el historial.
  const navigate = useCallback(
    (screenName) => {
      historyRef.current.push(currentScreen);
      setCurrentScreen(screenName);
      setNavKey((key) => key + 1);
    },
    [currentScreen]
  );

  // Regresa a la pantalla anterior si existe historial.
  const goBack = useCallback(() => {
    if (historyRef.current.length === 0) return;

    const previousScreen = historyRef.current.pop();

    setCurrentScreen(previousScreen);
    setNavKey((key) => key + 1);
  }, []);

  // Objeto navigation compatible con las pantallas existentes.
  // Así las pantallas pueden seguir usando navigation.navigate() y navigation.goBack().
  const navigation = useMemo(
    () => ({
      navigate,
      goBack,
    }),
    [navigate, goBack]
  );

  // Muestra una pantalla de carga mientras Firebase verifica la sesión.
  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Iniciando...</Text>
      </View>
    );
  }

  // Selecciona el grupo de pantallas según exista o no un usuario autenticado.
  const screens = user ? PRIVATE_SCREENS : PUBLIC_SCREENS;

  // Busca el componente correspondiente a la pantalla actual.
  // Si por alguna razón no existe, usa una pantalla segura por defecto.
  const ScreenComponent =
    screens[currentScreen] || (user ? DashboardScreen : LoginScreen);

  return (
    <View style={styles.screen}>
      <ScreenComponent key={navKey} navigation={navigation} />
    </View>
  );
}

// ======================================================
// Estilos principales de App.js.
// Se conserva position absolute porque ayuda a mantener
// correctamente el layout y el scroll en escritorio.
// ======================================================

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#94a3b8',
    marginTop: 14,
    fontSize: 16,
  },
});