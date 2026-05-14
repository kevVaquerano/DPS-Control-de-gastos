// ======================================================
// HistoryScreen.js
// Pantalla que muestra el historial de gastos del usuario.
// Permite seleccionar un mes, calcular el total y listar
// los gastos registrados en Firestore.
// ======================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../../api/firebaseConfig';

// Íconos visuales para cada categoría de gasto.
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

// Meses utilizados para el filtro del historial.
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

// Convierte fechas de Firestore o fechas normales a Date.
const getExpenseDate = (date) => date?.toDate?.() || new Date(date);

// Convierte el monto a número para evitar errores si viene vacío.
const getAmount = (amount) => Number(amount || 0);

export default function HistoryScreen({ navigation }) {
  // Detecta el tamaño de pantalla para aplicar diseño responsive.
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Año actual usado para filtrar gastos.
  const currentYear = new Date().getFullYear();

  // Estados principales de la pantalla.
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  // Estilos responsive centralizados.
  // Esto evita crear muchas clases separadas tipo titleMobile/titleDesktop.
  const layout = useMemo(
    () => ({
      contentWrap: isDesktop && styles.contentWrapDesktop,

      headerCard: {
        maxWidth: isDesktop ? 700 : undefined,
        minHeight: isDesktop ? 96 : 92,
        borderRadius: isDesktop ? 22 : 12,
        paddingHorizontal: isDesktop ? 26 : 18,
        paddingVertical: isDesktop ? 16 : 14,
        alignSelf: isDesktop ? 'center' : undefined,
      },

      title: {
        fontSize: isDesktop ? 30 : 18,
      },

      backButton: {
        minWidth: isDesktop ? 128 : 96,
        minHeight: isDesktop ? 52 : 46,
        borderRadius: isDesktop ? 14 : 10,
        paddingHorizontal: 14,
      },

      backButtonText: {
        fontSize: isDesktop ? 17 : 15,
      },

      totalCard: {
        maxWidth: isDesktop ? 700 : undefined,
        minHeight: isDesktop ? 170 : undefined,
        borderRadius: isDesktop ? 22 : 18,
        paddingVertical: isDesktop ? 24 : 22,
        paddingHorizontal: isDesktop ? 24 : 22,
        alignSelf: isDesktop ? 'center' : undefined,
        justifyContent: isDesktop ? 'center' : undefined,
      },

      totalLabel: {
        fontSize: isDesktop ? 18 : 15,
      },

      totalAmount: {
        fontSize: isDesktop ? 58 : 42,
        marginTop: isDesktop ? 10 : 8,
      },

      totalCount: {
        fontSize: isDesktop ? 17 : 13,
        marginTop: isDesktop ? 8 : 6,
      },

      historyCard: {
        maxWidth: isDesktop ? 700 : undefined,
        height: isDesktop ? undefined : 320,
        minHeight: isDesktop ? 220 : undefined,
        borderRadius: isDesktop ? 22 : 18,
        paddingBottom: isDesktop ? 6 : 16,
        alignSelf: isDesktop ? 'center' : undefined,
      },

      historyTitle: {
        fontSize: isDesktop ? 19 : 18,
      },

      item: {
        minHeight: isDesktop ? 84 : undefined,
        borderRadius: isDesktop ? 16 : 12,
        paddingHorizontal: isDesktop ? 18 : 14,
        paddingVertical: 14,
      },

      itemIcon: {
        fontSize: isDesktop ? 30 : 24,
        marginRight: isDesktop ? 16 : 12,
      },

      itemName: {
        fontSize: isDesktop ? 18 : 15,
      },

      itemMeta: {
        fontSize: isDesktop ? 14 : 12,
        marginTop: isDesktop ? 4 : 2,
      },

      itemAmount: {
        fontSize: isDesktop ? 18 : 16,
      },

      emptyText: {
        fontSize: isDesktop ? 17 : 15,
      },
    }),
    [isDesktop]
  );

  // Texto que se muestra dentro del selector de mes.
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

      // Consulta ordenada del gasto más reciente al más antiguo.
      const expensesQuery = query(expensesRef, orderBy('date', 'desc'));

      const snapshot = await getDocs(expensesQuery);

      // Convierte los documentos de Firestore a objetos de JavaScript.
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

  // Formatea la fecha de cada gasto.
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

  // Texto de conteo mostrado en la tarjeta del total.
  const totalCountText =
    selectedMonth !== null
      ? `${filteredExpenses.length} gasto${
          filteredExpenses.length !== 1 ? 's' : ''
        }`
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

          {/* Selector de mes */}
          <View
            style={[
              styles.dropdownBlock,
              isDesktop && styles.dropdownBlockDesktop,
            ]}
          >
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

            {/* Menú desplegable de meses */}
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
              <ActivityIndicator
                color="#38bdf8"
                size="large"
                style={styles.loader}
              />
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
// Se dejaron solo estilos base reutilizables.
// Los cambios móvil/escritorio se manejan en el objeto layout.
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f172a',
  },

  pageScroll: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
  },

  pageScrollContent: {
    width: '100%',
    paddingBottom: 28,
  },

  contentWrap: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 20,
  },

  contentWrapDesktop: {
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 28,
  },

  headerCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,
    color: '#f8fafc',
    fontWeight: 'bold',
    marginRight: 12,
  },

  backButton: {
    borderWidth: 1.5,
    borderColor: '#4da3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: '#4da3ff',
    fontWeight: '700',
  },

  dropdownBlock: {
    width: '100%',
    marginBottom: 16,
    zIndex: 20,
  },

  dropdownBlockDesktop: {
    maxWidth: 700,
    alignSelf: 'center',
  },

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  dropdownSideBox: {
    width: 62,
    minHeight: 62,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownLeftSide: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  dropdownRightSide: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderColor: '#4da3ff',
  },

  dropdownIcon: {
    fontSize: 22,
  },

  dropdownMain: {
    flex: 1,
    minHeight: 62,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  dropdownText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },

  dropdownPlaceholder: {
    color: '#94a3b8',
    fontWeight: '500',
  },

  dropdownArrow: {
    color: '#4da3ff',
    fontSize: 28,
    fontWeight: '700',
  },

  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    maxHeight: 240,
    overflow: 'hidden',
  },

  dropdownMenuScroll: {
    maxHeight: 240,
  },

  dropdownOption: {
    paddingVertical: 14,
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
  },

  dropdownOptionTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  totalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },

  totalLabel: {
    color: '#94a3b8',
    textAlign: 'center',
  },

  totalAmount: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },

  totalCount: {
    color: '#64748b',
    textAlign: 'center',
  },

  historyCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    padding: 16,
  },

  historyTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 12,
  },

  loader: {
    marginTop: 30,
  },

  historyScroll: {
    flex: 1,
  },

  historyScrollContent: {
    paddingRight: 6,
    paddingBottom: 4,
  },

  historyDesktopList: {
    paddingBottom: 4,
  },

  historyEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  item: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  itemIcon: {
    marginRight: 12,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    color: '#f8fafc',
    fontWeight: '600',
  },

  itemMeta: {
    color: '#94a3b8',
  },

  itemAmount: {
    color: '#ef4444',
    fontWeight: '700',
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
  },
});