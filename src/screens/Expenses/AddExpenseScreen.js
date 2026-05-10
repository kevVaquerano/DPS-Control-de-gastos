import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../api/firebaseConfig';

const CATEGORIES = [
  { label: 'Alimentación', icon: '🍔' },
  { label: 'Transporte', icon: '🚗' },
  { label: 'Entretenimiento', icon: '🎮' },
  { label: 'Salud', icon: '🏥' },
  { label: 'Educación', icon: '📚' },
  { label: 'Vivienda', icon: '🏠' },
  { label: 'Servicios', icon: '💡' },
  { label: 'Compras', icon: '🛍️' },
  { label: 'Otros', icon: '📦' },
];

export default function AddExpenseScreen({ navigation }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Campo requerido', 'Ingresa el nombre del gasto.');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert('Monto inválido', 'Ingresa un monto válido mayor a 0.');
      return;
    }
    if (!category) {
      showAlert('Categoría requerida', 'Selecciona una categoría.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'users', user.uid, 'expenses'), {
        name: name.trim(),
        amount: parsedAmount,
        category,
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
        userId: user.uid,
      });
      showAlert('¡Listo!', 'Gasto registrado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      showAlert('Error', 'No se pudo guardar el gasto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Gasto</Text>
        </View>

        {/* Nombre */}
        <Text style={styles.label}>Nombre del gasto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Almuerzo, Gasolina, Netflix..."
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />

        {/* Monto */}
        <Text style={styles.label}>Monto ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#64748b"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Categoría */}
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.catBtn, category === cat.label && styles.catBtnSelected]}
              onPress={() => setCategory(cat.label)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, category === cat.label && styles.catLabelSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0f172a" />
            : <Text style={styles.saveBtnText}>💾  Guardar Gasto</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 40,
  },
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#38bdf8', fontSize: 15 },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: 'bold' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: '30%',
    flexGrow: 1,
  },
  catBtnSelected: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
  },
  catIcon: { fontSize: 22, marginBottom: 4 },
  catLabel: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  catLabelSelected: { color: '#38bdf8', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  disabled: { opacity: 0.5 },
  saveBtnText: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
});
