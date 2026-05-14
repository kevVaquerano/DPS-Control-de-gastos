// ======================================================
// DashboardScreen.js
// Pantalla principal después de iniciar sesión.
// Muestra el total mensual, accesos rápidos y gastos recientes.
// ======================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { signOut } from 'firebase/auth';

import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { auth, db } from '../../api/firebaseConfig';

// Íconos utilizados para representar visualmente cada categoría.
const CATEGORY_ICONS = {
  Alimentación: '🍔',
  Transporte: '🚗',
  Entretenimiento: '🎮',
  Salud: '🏥',
  Educación: '📚',
  Vivienda: '🏠',
  Servicios: '💡',
  Compras: '🛍️',
  Otros: '📦',
};

// Convierte el monto a número y evita errores si viene vacío o indefinido.
const getAmount = (amount) => Number(amount || 0);

export default function DashboardScreen({ navigation }) {
  // Detecta si se usa vista escritorio para adaptar tamaños.
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Usuario actualmente autenticado en Firebase.
  const user = auth.currentUser;

  // Lista de gastos del mes actual.
  const [expenses, setExpenses] = useState([]);

  // Controla el indicador de carga.
  const [loading, setLoading] = useState(true);

  // Etiqueta del mes actual. Ejemplo: "mayo de 2026".
  const monthLabel = new Date().toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  // Calcula el total mensual a partir de la lista de gastos.
  // useMemo evita recalcular el total en cada render innecesario.
  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + getAmount(expense.amount), 0),
    [expenses]
  );

  // Muestra menos gastos recientes en escritorio para conservar diseño.
  const recentExpenses = useMemo(
    () => expenses.slice(0, isDesktop ? 3 : 5),
    [expenses, isDesktop]
  );

  // Carga desde Firestore solo los gastos del mes actual.
  const fetchMonthExpenses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const now = new Date();

      // Primer día del mes actual.
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Ruta de gastos del usuario autenticado.
      const expensesRef = collection(db, 'users', user.uid, 'expenses');

      // Consulta: gastos desde el inicio del mes, ordenados del más reciente al más antiguo.
      const monthQuery = query(
        expensesRef,
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(monthQuery);

      // Convierte documentos de Firestore en objetos utilizables en React.
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(data);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Ejecuta la carga inicial al abrir el Dashboard.
  useEffect(() => {
    fetchMonthExpenses();
  }, [fetchMonthExpenses]);

  // Cierra la sesión del usuario.
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Renderiza un gasto reciente.
  // Se separa en función para mantener limpio el JSX principal.
  const renderExpenseItem = (expense) => {
    const amount = getAmount(expense.amount).toFixed(2);
    const icon = CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Otros;

    return (
      <View
        key={expense.id}
        style={[styles.expenseItem, isDesktop && styles.expenseItemDesktop]}
      >
        <Text style={[styles.expenseIcon, isDesktop && styles.expenseIconDesktop]}>
          {icon}
        </Text>

        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseName, isDesktop && styles.expenseNameDesktop]}>
            {expense.name}
          </Text>
          <Text style={[styles.expenseCategory, isDesktop && styles.expenseCategoryDesktop]}>
            {expense.category}
          </Text>
        </View>

        <Text style={[styles.expenseAmount, isDesktop && styles.expenseAmountDesktop]}>
          -${amount}
        </Text>
      </View>
    );
  };

  // Contenido principal del Dashboard.
  const content = (
    <View style={[styles.wrapper, isDesktop && styles.wrapperDesktop]}>
      {/* Encabezado superior con correo y botón salir */}
      <View style={[styles.topHeader, isDesktop && styles.topHeaderDesktop]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, isDesktop && styles.greetingDesktop]}>
            Bienvenido 👋
          </Text>
          <Text style={[styles.email, isDesktop && styles.emailDesktop]}>
            {user?.email || 'Usuario'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, isDesktop && styles.logoutButtonDesktop]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Tarjeta del total mensual */}
        <View style={[styles.summaryCard, isDesktop && styles.summaryCardDesktop]}>
          <Text style={[styles.cardLabel, isDesktop && styles.cardLabelDesktop]}>
            Total de {monthLabel}
          </Text>

          {loading ? (
            <ActivityIndicator color="#38bdf8" size="large" style={styles.cardLoader} />
          ) : (
            <Text style={[styles.cardAmount, isDesktop && styles.cardAmountDesktop]}>
              ${monthlyTotal.toFixed(2)}
            </Text>
          )}

          <Text style={[styles.cardSub, isDesktop && styles.cardSubDesktop]}>
            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado
            {expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Botones de acciones principales */}
        <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>
          <TouchableOpacity
            style={[styles.actionPrimary, isDesktop && styles.actionDesktop]}
            onPress={() => navigation.navigate('AddExpense')}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionIcon, isDesktop && styles.actionIconDesktop]}>
              ➕
            </Text>
            <Text style={[styles.actionTextPrimary, isDesktop && styles.actionTextDesktop]}>
              Agregar{'\n'}Gasto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSecondary, isDesktop && styles.actionDesktop]}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionIcon, isDesktop && styles.actionIconDesktop]}>
              📋
            </Text>
            <Text style={[styles.actionTextSecondary, isDesktop && styles.actionTextDesktop]}>
              Ver{'\n'}Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección de gastos recientes */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            Gastos Recientes
          </Text>

          {loading ? (
            <ActivityIndicator color="#38bdf8" style={styles.listLoader} />
          ) : recentExpenses.length === 0 ? (
            <View style={[styles.empty, isDesktop && styles.emptyDesktop]}>
              <Text style={styles.emptyIcon}>🫙</Text>
              <Text style={styles.emptyText}>Sin gastos este mes</Text>
              <Text style={styles.emptySubText}>¡Agrega tu primer gasto!</Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentExpenses.map(renderExpenseItem)}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.scrollContent,
        isDesktop && styles.scrollContentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

// ======================================================
// Estilos del Dashboard.
// Se eliminaron estilos duplicados y se mantuvieron nombres
// descriptivos según la sección visual.
// ======================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  scrollContentDesktop: {
    width: '100%',
    minHeight: '100vh',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  wrapper: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },

  wrapperDesktop: {
    maxWidth: 1000,
  },

  body: {
    width: '100%',
  },

  topHeader: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topHeaderDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    marginBottom: 18,
  },

  headerLeft: {
    flex: 1,
    marginRight: 16,
  },

  greeting: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
  },

  greetingDesktop: {
    fontSize: 34,
  },

  email: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 6,
  },

  emailDesktop: {
    fontSize: 18,
    marginTop: 8,
  },

  logoutButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  logoutButtonDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  logoutText: {
    color: '#ef4444',
    fontSize: 17,
    fontWeight: '700',
  },

  summaryCard: {
    width: '100%',
    minHeight: 240,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  summaryCardDesktop: {
    minHeight: 160,
    paddingHorizontal: 24,
    paddingVertical: 22,
    marginBottom: 18,
  },

  cardLabel: {
    color: '#64748b',
    fontSize: 20,
    textAlign: 'center',
  },

  cardLabelDesktop: {
    fontSize: 22,
  },

  cardLoader: {
    marginVertical: 12,
  },

  cardAmount: {
    color: '#38bdf8',
    fontSize: 58,
    fontWeight: 'bold',
    marginTop: 12,
  },

  cardAmountDesktop: {
    fontSize: 54,
    marginTop: 10,
  },

  cardSub: {
    color: '#475569',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },

  cardSubDesktop: {
    fontSize: 18,
    marginTop: 8,
  },

  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 18,
    marginBottom: 28,
  },

  actionsDesktop: {
    gap: 22,
    marginBottom: 18,
  },

  actionPrimary: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#38bdf8',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionSecondary: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionDesktop: {
    flex: 0.9,
    minHeight: 150,
  },

  actionIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  actionIconDesktop: {
    fontSize: 38,
  },

  actionTextPrimary: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  actionTextSecondary: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  actionTextDesktop: {
    fontSize: 22,
    lineHeight: 30,
  },

  recentSection: {
    width: '100%',
    marginTop: 8,
  },

  sectionTitle: {
    width: '100%',
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },

  sectionTitleDesktop: {
    marginBottom: 12,
  },

  listLoader: {
    marginTop: 24,
  },

  recentList: {
    width: '100%',
  },

  expenseItem: {
    width: '100%',
    minHeight: 96,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  expenseItemDesktop: {
    minHeight: 74,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 10,
  },

  expenseIcon: {
    fontSize: 30,
    marginRight: 14,
  },

  expenseIconDesktop: {
    fontSize: 28,
  },

  expenseInfo: {
    flex: 1,
  },

  expenseName: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
  },

  expenseNameDesktop: {
    fontSize: 20,
  },

  expenseCategory: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },

  expenseCategoryDesktop: {
    marginTop: 2,
  },

  expenseAmount: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: '700',
  },

  expenseAmountDesktop: {
    fontSize: 24,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyDesktop: {
    paddingVertical: 28,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
  },

  emptySubText: {
    color: '#475569',
    fontSize: 15,
    marginTop: 4,
  },
});