import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function HistoryScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const currentYear = new Date().getFullYear();

  const fetchAllExpenses = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const q = query(expensesRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllExpenses(); }, []);

  const filtered = expenses.filter(e => {
    const d = e.date?.toDate?.() || new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
  });

  const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  const formatDate = (timestamp) => {
    const d = timestamp?.toDate?.() || new Date(timestamp);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemIcon}>{CATEGORY_ICONS[item.category] || '📦'}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category} · {formatDate(item.date)}</Text>
      </View>
      <Text style={styles.itemAmount}>-${item.amount?.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial de Gastos</Text>
      </View>

      {/* Filtro por mes */}
      <FlatList
        horizontal
        data={MONTHS}
        keyExtractor={(_, i) => String(i)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthRow}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.monthChip, selectedMonth === index && styles.monthChipActive]}
            onPress={() => setSelectedMonth(index)}
          >
            <Text style={[styles.monthText, selectedMonth === index && styles.monthTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Total del mes */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          {MONTHS[selectedMonth]} {currentYear}
        </Text>
        <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        <Text style={styles.totalCount}>
          {filtered.length} gasto{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color="#38bdf8" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🫙</Text>
              <Text style={styles.emptyText}>Sin gastos en {MONTHS[selectedMonth]}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: '#38bdf8', fontSize: 15 },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: 'bold' },
  monthRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthChipActive: { backgroundColor: '#0c4a6e', borderColor: '#38bdf8' },
  monthText: { color: '#64748b', fontSize: 13 },
  monthTextActive: { color: '#38bdf8', fontWeight: '700' },
  totalCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalLabel: { color: '#64748b', fontSize: 13 },
  totalAmount: { color: '#38bdf8', fontSize: 38, fontWeight: 'bold', marginTop: 6 },
  totalCount: { color: '#475569', fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  item: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemIcon: { fontSize: 26, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { color: '#f8fafc', fontSize: 15, fontWeight: '600' },
  itemMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  itemAmount: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#64748b', fontSize: 15 },
});
