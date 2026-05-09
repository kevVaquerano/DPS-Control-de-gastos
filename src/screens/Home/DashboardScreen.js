import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { auth } from '../../api/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function DashboardScreen() {
  const handleLogout = () => {
    signOut(auth).catch(error => console.log('Error al cerrar sesión', error));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido al Dashboard</Text>
      <Text style={styles.subtitle}>Sesión iniciada como: {auth.currentUser?.email}</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} color="#FF5252" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 }
});