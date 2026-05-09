import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Tus llaves reales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAFrcITyCSmxgW7h9UOnSxbXdy9CVE-BNM",
  authDomain: "dps-control-de-gastos.firebaseapp.com",
  projectId: "dps-control-de-gastos",
  storageBucket: "dps-control-de-gastos.firebasestorage.app",
  messagingSenderId: "423141717333",
  appId: "1:423141717333:web:5a5117f47242c5a1b16bdc",
  measurementId: "G-V8J2MMYVX4"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos Analytics (Solo si es soportado/Web)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Configuración de Auth con persistencia
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth, app };
export const db = getFirestore(app);