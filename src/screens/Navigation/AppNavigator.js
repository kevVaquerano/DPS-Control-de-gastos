// ======================================================
// AppNavigator.js
// Archivo encargado de controlar la navegación principal.
// Muestra pantallas diferentes dependiendo si hay usuario
// autenticado o no.
// ======================================================

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../Auth/LoginScreen';
import RegisterScreen from '../Auth/RegisterScreen';
import DashboardScreen from '../Home/DashboardScreen';
import AddExpenseScreen from '../Expenses/AddExpenseScreen';
import HistoryScreen from '../Expenses/HistoryScreen';

// Crea el navegador tipo Stack.
const Stack = createStackNavigator();

// Pantallas disponibles cuando el usuario ya inició sesión.
const AUTHENTICATED_SCREENS = [
  {
    name: 'Dashboard',
    component: DashboardScreen,
  },
  {
    name: 'AddExpense',
    component: AddExpenseScreen,
  },
  {
    name: 'History',
    component: HistoryScreen,
  },
];

// Pantallas disponibles cuando el usuario no ha iniciado sesión.
const GUEST_SCREENS = [
  {
    name: 'Login',
    component: LoginScreen,
  },
  {
    name: 'Register',
    component: RegisterScreen,
  },
];

export default function AppNavigator({ user }) {
  // Si existe usuario autenticado, se muestran pantallas internas.
  // Si no existe usuario, se muestran pantallas de acceso.
  const screens = user ? AUTHENTICATED_SCREENS : GUEST_SCREENS;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
        />
      ))}
    </Stack.Navigator>
  );
}