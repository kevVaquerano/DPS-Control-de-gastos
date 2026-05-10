import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../api/firebaseConfig';

const CATEGORY_ICONS = {
  'Alimentación': '🍔',
  'Transporte': '🚗',
  'Entretenimiento': '🎮',
  'Salud': '🏥',
  'Educación': '📚',
  'Vivienda': '🏠',
  'Servicios': '💡',
  'Compras': '🛍️',
  'Otros': '📦',
};

export default function DashboardScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const fetchMonthExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const q = query(
        expensesRef,
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        orderBy('date', 'desc'),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
      setMonthlyTotal(data.reduce((sum, e) => sum + (e.amount || 0), 0));
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMonthExpenses(); }, []);

  const handleLogout = () => signOut(auth).catch(console.error);

  const monthLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const recent = expenses.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bienvenido 👋</Text>
          <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta total mensual */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total de {monthLabel}</Text>
        {loading
          ? <ActivityIndicator color="#38bdf8" size="large" style={{ marginVertical: 12 }} />
          : <Text style={styles.cardAmount}>${monthlyTotal.toFixed(2)}</Text>
        }
        <Text style={styles.cardSub}>
          {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionPrimary} onPress={() => navigation.navigate('AddExpense')}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionTextPrimary}>Agregar{'\n'}Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSecondary} onPress={() => navigation.navigate('History')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTextSecondary}>Ver{'\n'}Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Gastos recientes */}
      <Text style={styles.sectionTitle}>Gastos Recientes</Text>

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 24 }} />
      ) : recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🫙</Text>
          <Text style={styles.emptyText}>Sin gastos este mes</Text>
          <Text style={styles.emptySubText}>¡Agrega tu primer gasto!</Text>
        </View>
      ) : (
        recent.map(expense => (
          <View key={expense.id} style={styles.expenseItem}>
            <Text style={styles.expenseIcon}>
              {CATEGORY_ICONS[expense.category] || '📦'}
            </Text>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseName}>{expense.name}</Text>
              <Text style={styles.expenseCategory}>{expense.category}</Text>
            </View>
            <Text style={styles.expenseAmount}>-${expense.amount?.toFixed(2)}</Text>
          </View>
        ))
      )}

      {expenses.length > 5 && (
        <TouchableOpacity style={styles.viewAll} onPress={() => navigation.navigate('History')}>
          <Text style={styles.viewAllText}>Ver todos los gastos →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { color: '#f8fafc', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#64748b', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLabel: { color: '#64748b', fontSize: 14 },
  cardAmount: { color: '#38bdf8', fontSize: 46, fontWeight: 'bold', marginTop: 8 },
  cardSub: { color: '#475569', fontSize: 13, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionPrimary: {
    flex: 1,
    backgroundColor: '#38bdf8',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTextPrimary: { color: '#0f172a', fontWeight: '700', textAlign: 'center', fontSize: 13 },
  actionTextSecondary: { color: '#f8fafc', fontWeight: '700', textAlign: 'center', fontSize: 13 },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#475569', fontSize: 14, marginTop: 4 },
  expenseItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  expenseIcon: { fontSize: 28, marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseName: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  expenseCategory: { color: '#64748b', fontSize: 12, marginTop: 2 },
  expenseAmount: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  viewAll: { alignItems: 'center', paddingVertical: 16 },
  viewAllText: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
});
