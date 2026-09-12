import React, { useState } from 'react';
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

/**
 * Mock Data - Datos iniciales de prueba extraídos del diseño
 */
const INITIAL_INGREDIENTS = [
  {
    id: '1',
    name: 'Espinaca fresca',
    quantity: '300 g',
    daysToExpiry: 2, // Rojo (<= 3 días)
  },
  {
    id: '2',
    name: 'Huevos',
    quantity: '6 unidades',
    daysToExpiry: 4, // Amarillo (4 a 7 días)
  },
  {
    id: '3',
    name: 'Leche entera',
    quantity: '1 L',
    daysToExpiry: 9, // Verde (> 7 días)
  },
  {
    id: '4',
    name: 'Arroz',
    quantity: '1 kg',
    daysToExpiry: 45, // Verde (> 7 días)
  },
  {
    id: '5',
    name: 'Tomate',
    quantity: '5 unidades',
    daysToExpiry: 3, // Rojo (<= 3 días)
  },
];

/**
 * DespensaScreen - Pantalla Principal del Módulo de Despensa
 * 
 * ¿POR QUÉ?
 * Gestiona el inventario de alimentos, permitiendo el registro, la consulta y la eliminación
 * de insumos (CRUD), además de controlar la sesión del usuario mediante un deslogueo seguro.
 * 
 * ¿CÓMO?
 * - Deslogueo: Se utiliza `navigation.replace('Login')` para destruir el stack de navegación,
 *   garantizando que el botón de retroceso físico de Android no regrese a la vista protegida.
 * - Eliminación: Se implementa la pulsación prolongada (`onLongPress`) en cada tarjeta, desplegando
 *   un `Alert.alert` nativo con acción destructiva que filtra el elemento por su identificador único.
 * - Registro: Mapea el contrato de formulario (`nombre`, `cantidad`, `unidad`) al formato visual de la lista.
 */
export const DespensaScreen = ({
  navigation = { navigate: () => {}, replace: () => {}, reset: () => {} },
  onSearchPress = () => {},
}) => {
  const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);
  const [isModalVisible, setModalVisible] = useState(false);

  /**
   * Cierra la sesión del usuario reemplazando la ruta actual para destruir el historial
   */
  const handleLogout = () => {
    if (navigation && typeof navigation.replace === 'function') {
      navigation.replace('Login');
    } else if (navigation && typeof navigation.reset === 'function') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    }
  };

  /**
   * Despliega alerta nativa de confirmación y elimina el ingrediente de la lista
   */
  const handleDelete = (ingredientId) => {
    Alert.alert(
      'Eliminar Ingrediente',
      '¿Estás seguro de que deseas eliminar este ingrediente de tu despensa?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setIngredients((prevList) =>
              prevList.filter((item) => item.id !== ingredientId)
            );
          },
        },
      ]
    );
  };

  /**
   * Agrega un nuevo ingrediente a la lista y actualiza el contador
   * Mapea tanto el payload del contrato backend (nombre, cantidad, unidad) como el estándar de la UI
   */
  const handleAddIngredient = (newIngredientData = {}) => {
    const displayName = newIngredientData.nombre || newIngredientData.name || 'Nuevo Ingrediente';
    const displayQuantity = newIngredientData.cantidad && newIngredientData.unidad
      ? `${newIngredientData.cantidad} ${newIngredientData.unidad}`
      : newIngredientData.quantity || '1 unidad';

    const newEntry = {
      id: String(Date.now()),
      name: displayName,
      quantity: displayQuantity,
      daysToExpiry: 7, // Estimación predeterminada
    };

    setIngredients((prevList) => [newEntry, ...prevList]);
  };

  /**
   * Renderiza cada tarjeta de alimento con soporte para onLongPress
   */
  const renderIngredientItem = ({ item }) => (
    <IngredientCard
      item={item}
      onPress={(selectedItem) => {
        // Interacción futura para ver detalle o editar
      }}
      onLongPress={() => handleDelete(item.id)}
    />
  );

  /**
   * Componente de encabezado dentro del flujo de la lista
   */
  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionTitle}>Ordenado por vencimiento</Text>
    </View>
  );

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
