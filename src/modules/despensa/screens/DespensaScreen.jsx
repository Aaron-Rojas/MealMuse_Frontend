import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IngredientCard } from '../components/IngredientCard';
import { AddIngredientModal } from '../components/AddIngredientModal';
import { FloatingActionButton } from '../../../shared/components/atoms/FloatingActionButton';
import { colors } from '../../../theme/colors';

import { signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { getPantry, addPantryItem, deletePantryItem } from '../../../services/api';

/**
 * Convierte una fecha en formato dd/mm/aaaa o ISO a días restantes
 */
function calculateDaysToExpiry(fechaCaducidad) {
  if (!fechaCaducidad) return 999;
  const expiry = new Date(fechaCaducidad);
  if (isNaN(expiry.getTime())) return 999;
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Convierte una fecha de entrada (dd/mm/aaaa o ISO) al formato ISO YYYY-MM-DD
 */
function parseFechaToISO(input) {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Transforma el objeto del backend al formato que espera IngredientCard
 */
function transformBackendItem(item) {
  return {
    id: String(item.id),
    backendId: item.id,
    name: item.ingrediente,
    quantity: `${item.cantidad} ${item.unidad}`,
    daysToExpiry: calculateDaysToExpiry(item.fecha_caducidad),
    fecha_caducidad: item.fecha_caducidad,
  };
}

/**
 * DespensaScreen - Pantalla Principal del Módulo de Despensa
 */
export const DespensaScreen = ({
  navigation = { navigate: () => {}, replace: () => {}, reset: () => {} },
  onSearchPress = () => {},
}) => {
  const [ingredients, setIngredients] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carga la despensa desde el backend al montar
   */
  const loadPantry = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPantry();
      setIngredients(data.map(transformBackendItem));
    } catch (error) {
      console.error('Error al cargar despensa:', error);
      Alert.alert('Error', 'No se pudo cargar tu despensa. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPantry();
  }, [loadPantry]);

  /**
   * Cierra la sesión del usuario en Firebase y navega a Login
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    if (navigation && typeof navigation.replace === 'function') {
      navigation.replace('Login');
    } else if (navigation && typeof navigation.reset === 'function') {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    }
  };

  /**
   * Elimina un ingrediente del backend y actualiza la lista
   */
  const handleDelete = (ingredient) => {
    Alert.alert(
      'Eliminar ingrediente',
      `¿Estás seguro de que deseas eliminar "${ingredient.name}" de tu despensa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Actualización optimista: quitamos de la UI primero
              setIngredients((prev) =>
                prev.filter((item) => item.id !== ingredient.id)
              );
              await deletePantryItem(ingredient.backendId);
            } catch (error) {
              console.error('Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar. Recargando lista...');
              loadPantry();
            }
          },
        },
      ]
    );
  };

  /**
   * Agrega un nuevo ingrediente llamando al backend
   */
  const handleAddIngredient = async (formData) => {
    const payload = {
      ingrediente: formData.nombre.trim(),
      cantidad: parseFloat(formData.cantidad),
      unidad: formData.unidad.trim(),
      fecha_caducidad: parseFechaToISO(formData.fechaVencimiento),
    };

    if (isNaN(payload.cantidad) || payload.cantidad <= 0) {
      throw new Error('La cantidad debe ser un número mayor a 0');
    }

    const newItem = await addPantryItem(payload);
    setIngredients((prev) => [transformBackendItem(newItem), ...prev]);
  };

  /**
   * Renderiza cada tarjeta
   */
  const renderIngredientItem = ({ item }) => (
    <IngredientCard
      item={item}
      onPress={() => {}}
      onLongPress={() => handleDelete(item)}
    />
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionTitle}>Ordenado por vencimiento</Text>
    </View>
  );

  const ListEmpty = () =>
    !isLoading ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Tu despensa está vacía</Text>
        <Text style={styles.emptySubtext}>
          Toca el botón + para agregar tu primer ingrediente
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.main} />

      {/* 1. Header Superior de la Pantalla */}
      <View style={styles.topBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Mi Despensa</Text>
          <Text style={styles.counterSubtitle}>
            {`${ingredients.length} ingredientes registrados`}
          </Text>
        </View>

        {/* Acciones de Cabecera: Lupa y Botón Salir */}
        <View style={styles.topActionsContainer}>
          <TouchableOpacity
            onPress={onSearchPress}
            activeOpacity={0.7}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="Buscar ingredientes en la despensa"
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerDivider} />

      {/* 2. Contenedor de Lista y FAB */}
      <View style={styles.bodyContainer}>
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={renderIngredientItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 3. Botón Flotante de Acción (FAB) */}
        <FloatingActionButton
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Agregar nuevo ingrediente a la despensa"
        />
      </View>

      {/* 4. Modal Bottom Sheet para Agregar Ingrediente */}
      <AddIngredientModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddIngredient}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  // Barra superior
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.background.main,
  },
  titleContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  counterSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  topActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchIcon: {
    fontSize: 16,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.error.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error.text,
    fontSize: 13,
    fontWeight: '700',
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    width: '100%',
  },
  bodyContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: -0.2,
  },
});

export default DespensaScreen;
