import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/api/firebaseConfig';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import DashboardScreen from './src/screens/Home/DashboardScreen';
import AddExpenseScreen from './src/screens/Expenses/AddExpenseScreen';
import HistoryScreen from './src/screens/Expenses/HistoryScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [navKey, setNavKey] = useState(0);
  const historyRef = useRef([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCurrentScreen('Dashboard');
      } else {
        setCurrentScreen('Login');
        historyRef.current = [];
      }
      setNavKey(k => k + 1);
      setLoading(false);
    }, (err) => {
      console.error('Auth error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navigate = useCallback((screenName) => {
    historyRef.current.push(currentScreen);
    setCurrentScreen(screenName);
    setNavKey(k => k + 1);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prevScreen = historyRef.current.pop();
    setCurrentScreen(prevScreen);
    setNavKey(k => k + 1);
  }, []);

  const navigation = useMemo(() => ({ navigate, goBack }), [navigate, goBack]);

  if (loading) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Iniciando...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    if (!user) {
      return currentScreen === 'Register'
        ? <RegisterScreen key={navKey} navigation={navigation} />
        : <LoginScreen    key={navKey} navigation={navigation} />;
    }
    switch (currentScreen) {
      case 'AddExpense': return <AddExpenseScreen key={navKey} navigation={navigation} />;
      case 'History':    return <HistoryScreen    key={navKey} navigation={navigation} />;
      default:           return <DashboardScreen  key={navKey} navigation={navigation} />;
    }
  };

  return (
    <View style={styles.fill}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#94a3b8', marginTop: 14, fontSize: 16 },
});
