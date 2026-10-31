import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { IngredientCard } from '../components/IngredientCard';
import { AddIngredientModal } from '../components/AddIngredientModal';
import { FloatingActionButton } from '../../../shared/components/atoms/FloatingActionButton';
import { colors } from '../../../theme/colors';
import { getPantry, addPantryItem, updatePantryItem, deletePantryItem, logoutFromBackend } from '../../../services/api';

function transformBackendItem(item) {
  if (item?.id == null) {
    throw new Error('Un ingrediente de la despensa no incluye un identificador');
  }
  const safeName = item?.ingrediente || item?.name || 'Ingrediente';
  const numericQuantity = Number(item?.cantidad);
  const safeQuantity = item?.cantidad != null && Number.isFinite(numericQuantity)
    ? `${numericQuantity} ${item.unidad || ''}`.trim()
    : null;

  return {
    id: String(item.id),
    backendId: item?.id,
    name: safeName,
    quantity: safeQuantity,
    cantidad: safeQuantity ? numericQuantity : null,
    unidad: item?.unidad ?? null,
    fecha_caducidad: item?.fecha_caducidad ?? null,
    fechaVencimiento: item?.fechaVencimiento ?? '',
    estado_vencimiento: item?.estado_vencimiento ?? null,
    dias_para_vencer: typeof item?.dias_para_vencer === 'number' ? item.dias_para_vencer : null,
  };
}

export const DespensaScreen = ({ navigation = { navigate: () => {}, replace: () => {}, reset: () => {} }, onSearchPress = () => {} }) => {
  const [ingredients, setIngredients] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const ingredientFormInitialValues = useMemo(() => editingIngredient ? {
    nombre: editingIngredient.name,
    cantidad: String(editingIngredient.cantidad ?? ''),
    unidad: editingIngredient.unidad ?? '',
    fechaVencimiento: editingIngredient.fechaVencimiento,
  } : null, [editingIngredient]);

  const loadPantry = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const data = await getPantry();
      setIngredients(data.map(transformBackendItem));
    } catch (error) {
      console.error('Error al cargar despensa:', error);
      setIngredients([]);
      setErrorMessage(error?.message || 'No se pudo cargar tu despensa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPantry();
    }, [loadPantry])
  );

  const handleLogout = async () => {
    try {
      await logoutFromBackend();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión de forma segura.');
    } finally {
      if (navigation && typeof navigation.reset === 'function') {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('Login');
      } else if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Login');
      }
    }
  };

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
              await deletePantryItem(ingredient.backendId);
              await loadPantry();
            } catch (error) {
              console.error('Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleSaveIngredient = async (formData) => {
    const payload = {
      ingrediente: formData.nombre.trim(),
      cantidad: Number(formData.cantidad),
      unidad: formData.unidad.trim(),
      fechaVencimiento: formData.fechaVencimiento,
    };

    if (!payload.ingrediente) {
      throw new Error('El nombre del ingrediente es obligatorio');
    }

    if (!Number.isFinite(payload.cantidad) || payload.cantidad <= 0) {
      throw new Error('La cantidad debe ser un número mayor a 0');
    }

    if (editingIngredient) {
      if (editingIngredient.backendId == null) {
        throw new Error('No se pudo identificar el ingrediente para editar');
      }
      await updatePantryItem(String(editingIngredient.backendId), payload);
    } else {
      await addPantryItem(payload);
    }
    await loadPantry();
  };

  const renderIngredientItem = ({ item }) => (
    <IngredientCard
      item={item}
      onPress={() => {
        setEditingIngredient(item);
        setModalVisible(true);
      }}
      onLongPress={() => handleDelete(item)}
    />
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.sectionTitle}>Ordenado por vencimiento</Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Cargando tu despensa…</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPantry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!ingredients.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Tu despensa está vacía</Text>
          <Text style={styles.emptySubtext}>Toca el botón + para agregar tu primer ingrediente.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id}
        renderItem={renderIngredientItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.main} />
      <View style={styles.topBar}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Mi Despensa</Text>
          <Text style={styles.counterSubtitle}>{`${ingredients.length} ingredientes registrados`}</Text>
        </View>

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

      <View style={styles.bodyContainer}>
        {renderContent()}
        <FloatingActionButton
          onPress={() => {
            setEditingIngredient(null);
            setModalVisible(true);
          }}
          accessibilityLabel="Agregar nuevo ingrediente a la despensa"
        />
      </View>

      <AddIngredientModal
        visible={isModalVisible}
        initialValues={ingredientFormInitialValues}
        submitLabel={editingIngredient ? 'Guardar cambios' : 'Guardar ingrediente'}
        onClose={() => {
          setModalVisible(false);
          setEditingIngredient(null);
        }}
        onSave={handleSaveIngredient}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.main },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  titleContainer: { flex: 1 },
  mainTitle: { fontSize: 32, fontWeight: '700', color: colors.text.primary },
  counterSubtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  topActionsContainer: { flexDirection: 'row', alignItems: 'center' },
  searchButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  searchIcon: { fontSize: 22 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primaryLight },
  logoutText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  headerDivider: { height: 1, backgroundColor: colors.border.light },
  bodyContainer: { flex: 1, position: 'relative' },
  listContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 90 },
  headerSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, color: colors.text.secondary, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  emptySubtext: { fontSize: 15, color: colors.text.secondary, textAlign: 'center' },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 10, fontSize: 14, color: colors.text.secondary },
  errorText: { color: colors.error.text, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
});
