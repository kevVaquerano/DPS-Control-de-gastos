// ======================================================
// firebaseConfig.js
// Archivo central de configuración de Firebase.
// Inicializa Firebase App, Authentication, Firestore y Analytics.
// ======================================================

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración del proyecto Firebase.
// Estos datos conectan la aplicación con el proyecto creado en Firebase.
const firebaseConfig = {
  apiKey: 'AIzaSyAFrcITyCSmxgW7h9UOnSxbXdy9CVE-BNM',
  authDomain: 'dps-control-de-gastos.firebaseapp.com',
  projectId: 'dps-control-de-gastos',
  storageBucket: 'dps-control-de-gastos.firebasestorage.app',
  messagingSenderId: '423141717333',
  appId: '1:423141717333:web:5a5117f47242c5a1b16bdc',
  measurementId: 'G-V8J2MMYVX4',
};

// Inicializa Firebase solo una vez.
// getApps() evita errores cuando la app se recarga en desarrollo.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializa Firestore.
// Firestore se usa para guardar y consultar los gastos del usuario.
const db = getFirestore(app);

// Inicializa Firebase Authentication.
// En web se usa getAuth() directamente.
// En móvil se usa AsyncStorage para mantener la sesión iniciada.
let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Si Auth ya fue inicializado por una recarga de desarrollo,
    // se reutiliza la instancia existente.
    auth = getAuth(app);
  }
}

// Inicializa Analytics solo en web y solo si el navegador lo soporta.
// En móvil retorna null para evitar errores innecesarios.
const analytics =
  Platform.OS === 'web'
    ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
    : Promise.resolve(null);

// Exportaciones principales usadas por las pantallas de la app.
export { app, auth, db, analytics };