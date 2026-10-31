import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Sin dato';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 'Sin dato';
  }

  return `${numericValue}${suffix}`;
}

export const NutritionCard = ({ recipe }) => {
  const nutrition = recipe?.nutricion || null;
  const inheritedCalories = Number(recipe?.calorias);
  const caloriesSource = nutrition
    ? nutrition.calorias_kcal
    : Number.isFinite(inheritedCalories) && inheritedCalories > 0
      ? inheritedCalories
      : null;

  const macroRows = [
    { key: 'proteinas', label: 'Proteínas', value: nutrition?.proteinas_g ?? null, unit: ' g' },
    { key: 'carbohidratos', label: 'Carbohidratos', value: nutrition?.carbohidratos_g ?? null, unit: ' g' },
    { key: 'grasas', label: 'Grasas', value: nutrition?.grasas_g ?? null, unit: ' g' },
  ];

  const hasCompleteMacros = macroRows.every((row) => (
    row.value !== null
    && row.value !== undefined
    && Number.isFinite(Number(row.value))
    && Number(row.value) >= 0
  ));
  const total = hasCompleteMacros
    ? macroRows.reduce((sum, row) => sum + Number(row.value), 0)
    : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Información nutricional</Text>

      {hasCompleteMacros && total > 0 ? (
        <View style={styles.barWrap}>
          {macroRows.map((row) => {
            const value = Number(row.value || 0);
            return (
              <View
                key={row.key}
                style={[
                  styles.barSegment,
                  {
                    flexGrow: value,
                    backgroundColor: row.key === 'proteinas' ? colors.status.success : row.key === 'carbohidratos' ? colors.status.warning : colors.status.info,
                  },
                ]}
              />
            );
          })}
          <View style={styles.legendRow}>
            {macroRows.map((row) => (
              <Text key={row.key} style={styles.legendText}>{row.label}</Text>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.label}>Calorías</Text>
          <Text style={styles.value}>{formatValue(caloriesSource, ' kcal')}</Text>
        </View>

        {macroRows.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value !== null && row.value !== undefined ? formatValue(row.value, row.unit) : 'Sin dato'}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Valores referenciales por porción; pueden variar según ingredientes y porciones.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 14,
  },
  title: { color: colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  barWrap: { flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 14 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  legendText: { fontSize: 11, color: colors.text.secondary },
  barSegment: { flexBasis: 0, height: 10 },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border.light, backgroundColor: '#F8FAFC' },
  label: { color: colors.text.secondary, fontWeight: '600' },
  value: { color: colors.text.primary, fontWeight: '700' },
  footer: { marginTop: 12, fontSize: 12, color: colors.text.secondary, lineHeight: 18 },
});
