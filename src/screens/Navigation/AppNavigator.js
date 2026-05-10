import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../Auth/LoginScreen';
import RegisterScreen from '../Auth/RegisterScreen';
import DashboardScreen from '../Home/DashboardScreen';
import AddExpenseScreen from '../Expenses/AddExpenseScreen';
import HistoryScreen from '../Expenses/HistoryScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ user }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
