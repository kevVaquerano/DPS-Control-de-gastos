import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth } from './src/api/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import LoginScreen from './src/screens/Auth/LoginScreen';
import DashboardScreen from './src/screens/Home/DashboardScreen';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unmount cleanup
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    user ? <DashboardScreen /> : <LoginScreen />
  );
}