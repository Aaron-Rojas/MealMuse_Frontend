import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { CustomInput } from '../../../shared/components/atoms/CustomInput';
import { PrimaryButton } from '../../../shared/components/atoms/PrimaryButton';
import { colors } from '../../../theme/colors';

// ---------------------------------------------------------------------------
// Unidades de medida aceptadas — deben estar sincronizadas con el backend
// (app/schemas/pantry.py  ›  UnidadMedida)
// ---------------------------------------------------------------------------
const UNIDADES = [
  { value: 'unidad', label: 'unidad  — pieza sin medida' },
  { value: 'kg', label: 'kg  — kilogramos' },
  { value: 'g', label: 'g  — gramos' },
  { value: 'mg', label: 'mg  — miligramos' },
  { value: 'lb', label: 'lb  — libras' },
  { value: 'oz', label: 'oz  — onzas' },
  { value: 'l', label: 'l  — litros' },
  { value: 'ml', label: 'ml  — mililitros' },

];

// Estado inicial del formulario con las claves exactas del contrato de datos
const INITIAL_FORM_STATE = {
  nombre: '',
  cantidad: '',
  unidad: '',
  fechaVencimiento: '',
};

/**
 * AddIngredientModal - Organismo Bottom Sheet para Registro de Ingredientes
 * 
 * ¿POR QUÉ?
 * Centraliza la captura de datos de nuevos alimentos con validaciones preventivas
 * en cliente y desacopla la capa de presentación del contrato de red (payload HTTP).
 * 
 * ¿CÓMO?
 * - Fase 1: Gestiona un único estado centralizado `formData` con `handleInputChange`.
 * - Fase 2: Ejecuta `validateForm()` antes del envío, mapeando errores en el estado `errors`.
 * - Fase 3: Emite el payload validado y deja estructurado el esqueleto de comunicación con `fetch`.
 */
export const AddIngredientModal = ({
  visible = false,
  onClose = () => { },
  onSave = () => { },
}) => {
  // 1. Estado centralizado del formulario
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // 2. Estado para el manejo de errores de validación por campo
  const [errors, setErrors] = useState({});

  // Estado de carga para la operación asíncrona
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para mostrar el picker de unidades
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  /**
   * Manejador genérico para actualizar dinámicamente cualquier campo del formulario
   */
  const handleInputChange = (campo, valor) => {
    setFormData((prevData) => ({
      ...prevData,
      [campo]: valor,
    }));

    // Limpia el error del campo cuando el usuario comienza a corregirlo
    if (errors[campo]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [campo]: '',
      }));
    }
  };

  /**
   * Valida preventivamente que los campos obligatorios contengan datos válidos
   * @returns {boolean} true si pasa todas las validaciones, false si hay errores
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre || !formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del ingrediente es obligatorio';
    }

    if (!formData.cantidad || !formData.cantidad.trim()) {
      newErrors.cantidad = 'La cantidad es requerida';
    }

    if (!formData.unidad || !formData.unidad.trim()) {
      newErrors.unidad = 'La unidad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Cierra el modal y limpia el formulario
   */
  const handleCloseModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  /**
   * Procesa el envío validado del formulario y conecta con el backend
   */
  const handleSubmit = async () => {
    // 1. Validar campos
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 2. Notificar al padre (que hará la llamada al backend)
      await onSave(formData);
      // 3. Cerrar y limpiar formulario
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
      setErrors((prev) => ({
        ...prev,
        general: error.message || 'No se pudo guardar el ingrediente',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseModal}
    >
      <View style={styles.backdrop}>
        {/* Capa para detectar toques en el fondo oscuro y cerrar el modal */}
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.overlayTouchArea} />
        </TouchableWithoutFeedback>

        {/* Contenedor del Bottom Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.contentCard}>
            {/* Barra indicadora superior gris */}
            <View style={styles.dragIndicator} />

            {/* Cabecera: Título y botón cerrar "✕" */}
            <View style={styles.headerRow}>
              <Text style={styles.sheetTitle}>Agregar ingrediente</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                activeOpacity={0.7}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Campo 1: Nombre del ingrediente */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre del ingrediente</Text>
                <CustomInput
                  value={formData.nombre}
                  onChangeText={(val) => handleInputChange('nombre', val)}
                  placeholder="Ej. Palta"
                  autoCapitalize="sentences"
                  hasError={Boolean(errors.nombre)}
                />
                {errors.nombre ? (
                  <Text style={styles.fieldErrorText}>{errors.nombre}</Text>
                ) : null}
              </View>

              {/* Fila horizontal: Cantidad y Unidad */}
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Cantidad</Text>
                  <CustomInput
                    value={formData.cantidad}
                    onChangeText={(val) => handleInputChange('cantidad', val)}
                    placeholder="2"
                    keyboardType="numeric"
                    hasError={Boolean(errors.cantidad)}
                  />
                  {errors.cantidad ? (
                    <Text style={styles.fieldErrorText}>{errors.cantidad}</Text>
                  ) : null}
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Unidad</Text>

                  {/* Botón que abre el picker de unidades */}
                  <TouchableOpacity
                    onPress={() => setShowUnitPicker(true)}
                    activeOpacity={0.75}
                    style={[
                      styles.unitPickerButton,
                      Boolean(errors.unidad) && styles.unitPickerButtonError,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar unidad de medida"
                  >
                    <Text
                      style={
                        formData.unidad
                          ? styles.unitPickerValue
                          : styles.unitPickerPlaceholder
                      }
                      numberOfLines={1}
                    >
                      {formData.unidad || 'Ej. kg, ml…'}
                    </Text>
                    <Text style={styles.unitPickerChevron}>▾</Text>
                  </TouchableOpacity>

                  {errors.unidad ? (
                    <Text style={styles.fieldErrorText}>{errors.unidad}</Text>
                  ) : null}

                  {/* Modal dropdown de unidades */}
                  <Modal
                    visible={showUnitPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowUnitPicker(false)}
                  >
                    <Pressable
                      style={styles.unitOverlay}
                      onPress={() => setShowUnitPicker(false)}
                    >
                      <View style={styles.unitDropdown}>
                        <Text style={styles.unitDropdownTitle}>
                          Selecciona la unidad
                        </Text>
                        <FlatList
                          data={UNIDADES}
                          keyExtractor={(item) => item.value}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[
                                styles.unitOption,
                                formData.unidad === item.value &&
                                styles.unitOptionSelected,
                              ]}
                              onPress={() => {
                                handleInputChange('unidad', item.value);
                                setShowUnitPicker(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.unitOptionText,
                                  formData.unidad === item.value &&
                                  styles.unitOptionTextSelected,
                                ]}
                              >
                                {item.label}
                              </Text>
                              {formData.unidad === item.value && (
                                <Text style={styles.unitOptionCheck}>✓</Text>
                              )}
                            </TouchableOpacity>
                          )}
                          showsVerticalScrollIndicator={false}
                        />
                      </View>
                    </Pressable>
                  </Modal>
                </View>
              </View>

              {/* Campo 3: Fecha de vencimiento (opcional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de vencimiento (opcional)</Text>
                <CustomInput
                  value={formData.fechaVencimiento}
                  onChangeText={(val) => handleInputChange('fechaVencimiento', val)}
                  placeholder="dd/mm/aaaa"
                />
              </View>

              {/* Banner Informativo Verde */}
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Se agrega en 3 pasos o menos
                </Text>
              </View>

              {/* Botón Guardar */}
              <PrimaryButton
                title="Guardar ingrediente"
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchArea: {
    flex: 1,
  },
  sheetContainer: {
    width: '100%',
  },
  contentCard: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  // Barra indicadora superior
  dragIndicator: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
    marginBottom: 16,
  },
  // Cabecera del modal
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  closeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  // Campos del formulario
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfField: {
    flex: 1,
  },
  fieldErrorText: {
    color: colors.error.text,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  // Banner de información
  infoBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  infoBannerText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Estilos del picker de unidades
  unitPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background.surface,
  },
  unitPickerButtonError: {
    borderColor: colors.error.text,
  },
  unitPickerValue: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  unitPickerPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: colors.text.secondary,
  },
  unitPickerChevron: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  // Overlay del dropdown
  unitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unitDropdown: {
    backgroundColor: colors.background.surface,
    borderRadius: 16,
    paddingVertical: 8,
    width: '100%',
    maxHeight: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  unitDropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: 4,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  unitOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  unitOptionText: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  unitOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  unitOptionCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  saveButton: {
    marginBottom: 8,
  },
});

export default AddIngredientModal;
