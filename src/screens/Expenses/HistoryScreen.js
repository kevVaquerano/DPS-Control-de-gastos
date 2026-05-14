// ======================================================
// HistoryScreen.js
// Pantalla que muestra el historial de gastos del usuario.
// Permite seleccionar un mes, calcular el total y listar
// los gastos registrados en Firestore.
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

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../../api/firebaseConfig';

// Íconos visuales para identificar cada categoría de gasto.
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

// Meses disponibles para filtrar el historial.
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// Convierte una fecha de Firestore o JavaScript en un objeto Date.
const getExpenseDate = (date) => date?.toDate?.() || new Date(date);

// Convierte el monto a número para evitar errores si viene vacío.
const getAmount = (amount) => Number(amount || 0);

export default function HistoryScreen({ navigation }) {
  // Detecta el ancho de pantalla para ajustar el diseño responsive.
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Año actual utilizado para filtrar los gastos.
  const currentYear = new Date().getFullYear();

  // Estados principales de la pantalla.
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  // Estilos calculados según el tamaño de pantalla.
  // Esto reduce estilos repetidos tipo titleMobile/titleDesktop.
  const layout = useMemo(
    () => ({
      contentWrap: isDesktop && styles.contentWrapDesktop,
      headerCard: {
        minHeight: isDesktop ? 78 : 72,
        paddingHorizontal: isDesktop ? 24 : 16,
      },
      title: { fontSize: isDesktop ? 30 : 22 },
      backButton: {
        minWidth: isDesktop ? 112 : 92,
        height: isDesktop ? 42 : 38,
        paddingHorizontal: isDesktop ? 16 : 12,
      },
      backButtonText: { fontSize: isDesktop ? 16 : 14 },
      totalCard: { paddingVertical: isDesktop ? 28 : 24 },
      totalLabel: { fontSize: isDesktop ? 20 : 17 },
      totalAmount: { fontSize: isDesktop ? 54 : 46 },
      totalCount: { fontSize: isDesktop ? 17 : 15 },
      historyCard: {
        minHeight: isDesktop ? 420 : 360,
        padding: isDesktop ? 22 : 18,
      },
      historyTitle: { fontSize: isDesktop ? 24 : 20 },
      item: {
        minHeight: isDesktop ? 74 : 86,
        paddingVertical: isDesktop ? 12 : 14,
      },
      itemIcon: { fontSize: isDesktop ? 30 : 28 },
      itemName: { fontSize: isDesktop ? 20 : 18 },
      itemMeta: { fontSize: isDesktop ? 14 : 13 },
      itemAmount: { fontSize: isDesktop ? 22 : 19 },
      emptyText: { fontSize: isDesktop ? 18 : 16 },
    }),
    [isDesktop]
  );

  // Texto que aparece dentro del selector.
  const selectedMonthLabel =
    selectedMonth !== null ? MONTHS[selectedMonth] : 'Selecciona un mes';

  // Carga todos los gastos del usuario autenticado desde Firestore.
  const fetchAllExpenses = useCallback(async () => {
    const user = auth.currentUser;

    // Si no hay usuario autenticado, se detiene la carga.
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Ruta: users/{uid}/expenses
      const expensesRef = collection(db, 'users', user.uid, 'expenses');

      // Ordena los gastos desde el más reciente al más antiguo.
      const expensesQuery = query(expensesRef, orderBy('date', 'desc'));

      const snapshot = await getDocs(expensesQuery);

      // Convierte documentos de Firestore a objetos de JavaScript.
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ejecuta la carga inicial al abrir la pantalla.
  useEffect(() => {
    fetchAllExpenses();
  }, [fetchAllExpenses]);

  // Filtra los gastos por mes seleccionado y año actual.
  // useMemo evita recalcular si no cambian los gastos o el mes.
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === null) return [];

    return expenses.filter((expense) => {
      const date = getExpenseDate(expense.date);

      return (
        date.getMonth() === selectedMonth &&
        date.getFullYear() === currentYear
      );
    });
  }, [expenses, selectedMonth, currentYear]);

  // Calcula el total del mes seleccionado.
  const total = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) => sum + getAmount(expense.amount),
        0
      ),
    [filteredExpenses]
  );

  // Formatea la fecha de cada gasto para mostrarla en forma corta.
  const formatDate = (dateValue) => {
    const date = getExpenseDate(dateValue);

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Selecciona un mes y cierra el menú desplegable.
  const handleSelectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setIsMonthOpen(false);
  };

  // Texto inferior de la tarjeta de total.
  const totalCountText =
    selectedMonth !== null
      ? `${filteredExpenses.length} gasto${filteredExpenses.length !== 1 ? 's' : ''}`
      : 'Debes seleccionar un mes';

  // Renderiza una fila individual del historial.
  const renderExpenseItem = (item) => {
    const icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Otros;
    const amount = getAmount(item.amount).toFixed(2);

    return (
      <View key={item.id} style={[styles.item, layout.item]}>
        <Text style={[styles.itemIcon, layout.itemIcon]}>{icon}</Text>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, layout.itemName]}>
            {item.name}
          </Text>

          <Text style={[styles.itemMeta, layout.itemMeta]}>
            {item.category} · {formatDate(item.date)}
          </Text>
        </View>

        <Text style={[styles.itemAmount, layout.itemAmount]}>
          -${amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={!isDesktop}
        persistentScrollbar={!isDesktop}
      >
        <View style={[styles.contentWrap, layout.contentWrap]}>
          {/* Encabezado principal */}
          <View style={[styles.headerCard, layout.headerCard]}>
            <Text style={[styles.title, layout.title]} numberOfLines={1}>
              Historial de Gastos
            </Text>

            <TouchableOpacity
              style={[styles.backButton, layout.backButton]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={[styles.backButtonText, layout.backButtonText]}>
                Volver
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector desplegable de meses */}
          <View style={[styles.dropdownBlock, isDesktop && styles.dropdownBlockDesktop]}>
            <View style={styles.dropdownRow}>
              <View style={[styles.dropdownSideBox, styles.dropdownLeftSide]}>
                <Text style={styles.dropdownIcon}>🗓️</Text>
              </View>

              <TouchableOpacity
                style={styles.dropdownMain}
                onPress={() => setIsMonthOpen((prev) => !prev)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedMonth === null && styles.dropdownPlaceholder,
                  ]}
                >
                  {selectedMonthLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownSideBox, styles.dropdownRightSide]}
                onPress={() => setIsMonthOpen((prev) => !prev)}
                activeOpacity={0.9}
              >
                <Text style={styles.dropdownArrow}>
                  {isMonthOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Opciones del selector de mes */}
            {isMonthOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownMenuScroll}
                  showsVerticalScrollIndicator
                  persistentScrollbar
                >
                  {MONTHS.map((month, index) => {
                    const active = selectedMonth === index;

                    return (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.dropdownOption,
                          active && styles.dropdownOptionActive,
                        ]}
                        onPress={() => handleSelectMonth(index)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            active && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Tarjeta del total mensual */}
          <View style={[styles.totalCard, layout.totalCard]}>
            <Text style={[styles.totalLabel, layout.totalLabel]}>
              {selectedMonth !== null
                ? `${MONTHS[selectedMonth]} ${currentYear}`
                : 'Total de gastos del mes seleccionado'}
            </Text>

            <Text style={[styles.totalAmount, layout.totalAmount]}>
              ${selectedMonth !== null ? total.toFixed(2) : '0.00'}
            </Text>

            <Text style={[styles.totalCount, layout.totalCount]}>
              {totalCountText}
            </Text>
          </View>

          {/* Lista del historial filtrado */}
          <View style={[styles.historyCard, layout.historyCard]}>
            <Text style={[styles.historyTitle, layout.historyTitle]}>
              Historial del mes seleccionado
            </Text>

            {loading ? (
              <ActivityIndicator color="#38bdf8" size="large" style={styles.loader} />
            ) : selectedMonth === null ? (
              <View style={styles.historyEmptyBox}>
                <Text style={styles.emptyIcon}>🫙</Text>
                <Text style={[styles.emptyText, layout.emptyText]}>
                  Selecciona un mes para ver el historial.
                </Text>
              </View>
            ) : filteredExpenses.length === 0 ? (
              <View style={styles.historyEmptyBox}>
                <Text style={styles.emptyIcon}>🫙</Text>
                <Text style={[styles.emptyText, layout.emptyText]}>
                  Sin gastos en {MONTHS[selectedMonth]}.
                </Text>
              </View>
            ) : isDesktop ? (
              <View style={styles.historyDesktopList}>
                {filteredExpenses.map(renderExpenseItem)}
              </View>
            ) : (
              <ScrollView
                style={styles.historyScroll}
                contentContainerStyle={styles.historyScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredExpenses.map(renderExpenseItem)}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ======================================================
// Estilos de HistoryScreen.
// Se redujeron estilos repetidos usando:
// 1. estilos base,
// 2. objeto layout para cambios responsive,
// 3. dropdownSideBox para ambos lados del selector.
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  pageScroll: {
    flex: 1,
    width: '100%',
  },

  pageScrollContent: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  contentWrap: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },

  contentWrapDesktop: {
    maxWidth: 1000,
  },

  headerCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  title: {
    flex: 1,
    color: '#f8fafc',
    fontWeight: '700',
    marginRight: 12,
  },

  backButton: {
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  dropdownBlock: {
    width: '100%',
    marginBottom: 16,
  },

  dropdownBlockDesktop: {
    maxWidth: 620,
    alignSelf: 'center',
  },

  dropdownRow: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dropdownSideBox: {
    width: 56,
    height: 56,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownLeftSide: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  dropdownRightSide: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },

  dropdownIcon: {
    fontSize: 22,
  },

  dropdownMain: {
    flex: 1,
    height: 56,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  dropdownText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },

  dropdownPlaceholder: {
    color: '#64748b',
  },

  dropdownArrow: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },

  dropdownMenu: {
    width: '100%',
    maxHeight: 260,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },

  dropdownMenuScroll: {
    maxHeight: 260,
  },

  dropdownOption: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },

  dropdownOptionActive: {
    backgroundColor: '#0c4a6e',
  },

  dropdownOptionText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },

  dropdownOptionTextActive: {
    color: '#38bdf8',
  },

  totalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },

  totalLabel: {
    color: '#64748b',
    textAlign: 'center',
  },

  totalAmount: {
    color: '#38bdf8',
    fontWeight: 'bold',
    marginTop: 8,
  },

  totalCount: {
    color: '#475569',
    marginTop: 8,
  },

  historyCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
  },

  historyTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 16,
  },

  loader: {
    marginTop: 30,
  },

  historyDesktopList: {
    width: '100%',
  },

  historyScroll: {
    maxHeight: 460,
  },

  historyScrollContent: {
    paddingBottom: 4,
  },

  item: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  itemIcon: {
    marginRight: 14,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    color: '#f8fafc',
    fontWeight: '700',
  },

  itemMeta: {
    color: '#64748b',
    marginTop: 4,
  },

  itemAmount: {
    color: '#ef4444',
    fontWeight: '700',
  },

  historyEmptyBox: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },

  emptyIcon: {
    fontSize: 46,
    marginBottom: 12,
  },

  emptyText: {
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
});