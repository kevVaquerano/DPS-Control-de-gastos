// ======================================================
// index.js
// Punto de entrada de la aplicación Expo.
// Registra App como el componente raíz del proyecto.
// ======================================================

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent permite que la app funcione correctamente
// tanto en Expo Go como en compilaciones nativas.
registerRootComponent(App);