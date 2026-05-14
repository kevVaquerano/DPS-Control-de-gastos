// ======================================================
// AddExpenseScreen.js
// Pantalla para registrar un nuevo gasto.
// Guarda nombre, monto, categoría y fecha en Firestore.
// ======================================================

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { addDoc, collection, Timestamp } from 'firebase/firestore';

import { auth, db } from '../../api/firebaseConfig';

// Categorías disponibles para clasificar el gasto.
// Cada categoría tiene un ícono para mejorar la lectura visual.
const CATEGORIES = [
  { label: 'Servicios', icon: '💡' },
  { label: 'Alimentación', icon: '🍔' },
  { label: 'Transporte', icon: '🚗' },
  { label: 'Vivienda', icon: '🏠' },
  { label: 'Salud', icon: '🏥' },
  { label: 'Educación', icon: '📚' },
  { label: 'Compras', icon: '🛍️' },
  { label: 'Entretenimiento', icon: '🎮' },
  { label: 'Otros', icon: '📦' },
];

// Función reutilizable para mostrar mensajes en web o móvil.
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function AddExpenseScreen({ navigation }) {
  // Detecta si se usa pantalla grande para ajustar el ancho del formulario.
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

  // Estados del formulario.
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  // Estado de carga al guardar el gasto.
  const [loading, setLoading] = useState(false);

  // Valida los datos del formulario antes de guardar.
  // Devuelve el monto convertido a número si todo está correcto.
  const validateForm = () => {
    const parsedAmount = Number.parseFloat(amount.replace(',', '.'));

    if (!name.trim()) {
      showAlert('Campo requerido', 'Ingresa el nombre del gasto.');
      return null;
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert('Monto inválido', 'Ingresa un monto válido mayor a 0.');
      return null;
    }

    if (!category) {
      showAlert('Categoría requerida', 'Selecciona una categoría.');
      return null;
    }

    return parsedAmount;
  };

  // Guarda el gasto en la colección del usuario autenticado.
  const handleSave = async () => {
    const parsedAmount = validateForm();
    if (parsedAmount === null) return;

    const user = auth.currentUser;

    if (!user) {
      showAlert('Sesión requerida', 'Debes iniciar sesión para guardar gastos.');
      return;
    }

    setLoading(true);

    try {
      const now = Timestamp.now();

      // Ruta: users/{uid}/expenses
      // Así cada usuario tiene su propio historial de gastos.
      await addDoc(collection(db, 'users', user.uid, 'expenses'), {
        name: name.trim(),
        amount: parsedAmount,
        category,
        date: now,
        createdAt: now,
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
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.formWrapper, isDesktop && styles.formWrapperDesktop]}>
          {/* Encabezado de la pantalla */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Nuevo Gasto</Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
          </View>

          {/* Campo de nombre del gasto */}
          <Text style={styles.label}>Nombre del gasto:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Almuerzo, Gasolina, Netflix..."
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          {/* Campo de monto */}
          <Text style={styles.label}>Monto:</Text>
          <View style={styles.amountRow}>
            <View style={styles.currencyBox}>
              <Text style={styles.currencyText}>$</Text>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Selector de categorías */}
          <View style={styles.categoriesPanel}>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.label;

                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryButton,
                      selected && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat.label)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        selected && styles.categoryLabelSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botón para guardar el gasto */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Guardar gasto</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ======================================================
// Estilos de AddExpenseScreen.
// Se dividen por: contenedor, formulario, encabezado,
// campos, categorías y botón guardar.
// ======================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 40,
  },

  scrollContentDesktop: {
    minHeight: '100vh',
  },

  formWrapper: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  formWrapperDesktop: {
    maxWidth: 620,
  },

  headerBox: {
    width: '100%',
    minHeight: 74,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  headerTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
  },

  backButton: {
    minWidth: 108,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  backText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },

  label: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 54,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 16,
  },

  amountRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  currencyBox: {
    width: 64,
    height: 54,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  currencyText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },

  amountInput: {
    flex: 1,
    height: 54,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: '#334155',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 16,
  },

  categoriesPanel: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },

  categoryButton: {
    width: '31.5%',
    minHeight: 86,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  categoryButtonSelected: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
  },

  categoryIcon: {
    fontSize: 20,
    marginBottom: 6,
  },

  categoryLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  categoryLabelSelected: {
    color: '#38bdf8',
  },

  saveButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  saveButtonText: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },

  disabled: {
    opacity: 0.5,
  },
});