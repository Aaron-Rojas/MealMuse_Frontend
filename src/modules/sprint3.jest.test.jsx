import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { getExpiryBadgeConfig } from '../services/expiryUtils';
import { isRecipeFavorite, normalizeMissingIngredients } from '../services/favoritesUtils';
import {
  deleteFavorite,
  deletePantryItem,
  generateRecipe,
  getCachedFavorites,
  getPantry,
  getPantrySummary,
  getProfile,
  listFavorites,
  saveFavorite,
  updatePantryItem,
} from '../services/api';
import { colors } from '../theme/colors';
import { ExpiryBadge } from '../shared/components/molecules/ExpiryBadge';
import { DespensaScreen } from './despensa/screens/DespensaScreen';
import { NutritionCard } from './recipes/components/NutritionCard';
import { FavoritesScreen } from './recipes/screens/FavoritesScreen';
import { RecipeHomeScreen } from './recipes/screens/RecipeHomeScreen';
import { RecipeSuggestionScreen } from './recipes/screens/RecipeSuggestionScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(() => callback(), [callback]),
}));

jest.mock('../services/api', () => ({
  deleteFavorite: jest.fn(),
  deletePantryItem: jest.fn(),
  generateRecipe: jest.fn(),
  getCachedFavorites: jest.fn(),
  getPantry: jest.fn(),
  getPantrySummary: jest.fn(),
  getProfile: jest.fn(),
  listFavorites: jest.fn(),
  saveFavorite: jest.fn(),
  updatePantryItem: jest.fn(),
  addPantryItem: jest.fn(),
  logoutFromBackend: jest.fn(),
}));

jest.mock('./despensa/components/AddIngredientModal', () => {
  const React = require('react');
  const ReactNative = require('react-native');
  return {
    AddIngredientModal: ({ visible, onSave }) => visible
      ? React.createElement(
        ReactNative.TouchableOpacity,
        { onPress: () => onSave({ nombre: 'Tomate', cantidad: '2', unidad: 'unidades', fechaVencimiento: '' }) },
        React.createElement(ReactNative.Text, null, 'Guardar prueba')
      )
      : null,
  };
});

const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: jest.fn(() => true) };
const recipe = {
  nombre: 'Sopa',
  calorias: 250,
  nutricion: { calorias_kcal: 250, proteinas_g: 10, carbohidratos_g: 20, grasas_g: 5 },
  ingredientes: ['Tomate'],
  pasos: ['Cocinar'],
  ingredientes_faltantes: [],
};
const savedFavorite = {
  id: 'favorite-1',
  nombre: 'Sopa',
  receta: recipe,
  fecha_guardado: '2026-11-06T12:00:00Z',
};

beforeEach(() => {
  jest.resetAllMocks();
  getCachedFavorites.mockReturnValue([]);
  getPantry.mockResolvedValue([]);
  getPantrySummary.mockResolvedValue({ por_vencer: 0, vencidos: 0 });
  getProfile.mockResolvedValue({ nombre: 'Esther' });
  listFavorites.mockResolvedValue([]);
  updatePantryItem.mockResolvedValue({});
  deletePantryItem.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

test('[HU-05 CA-02] ExpiryBadge comunica el estado con etiqueta y tono, no solo color', async () => {
  const states = [
    [{ estado_vencimiento: 'vencido', dias_para_vencer: -1 }, 'Vencido hace 1 día', colors.status.expiredText],
    [{ estado_vencimiento: 'por_vencer', dias_para_vencer: 0 }, 'Vence hoy', colors.status.expiringText],
    [{ estado_vencimiento: 'por_vencer', dias_para_vencer: 1 }, 'Vence mañana', colors.status.expiringText],
    [{ estado_vencimiento: 'por_vencer', dias_para_vencer: 4 }, 'Vence en 4 días', colors.status.expiringText],
    [{ estado_vencimiento: 'vigente' }, 'Vigente', colors.status.currentText],
    [{ estado_vencimiento: 'sin_fecha' }, 'Sin fecha', colors.status.neutralText],
  ];

  for (const [input, label, color] of states) {
    const view = await render(<ExpiryBadge {...input} />);
    const text = view.getByText(label);
    expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color })]));
    await view.unmount();
  }
});

test('[HU-05 CA-02] El estado de vencimiento no se recalcula con días cuando falta el estado del backend', () => {
  expect(getExpiryBadgeConfig({ dias_para_vencer: -5 }).label).toBe('Sin fecha');
  expect(getExpiryBadgeConfig({ dias_para_vencer: 0 }).label).toBe('Sin fecha');
});

test('[HU-05 CA-01/03] Editar y eliminar reflejan el orden recibido del backend sin recargar manualmente', async () => {
  const initial = [
    { id: 1, ingrediente: 'Zanahoria', cantidad: 1, unidad: 'unidad', estado_vencimiento: 'vigente' },
    { id: 2, ingrediente: 'Tomate', cantidad: 2, unidad: 'unidades', estado_vencimiento: 'por_vencer' },
  ];
  const reorderedByBackend = [{ ...initial[1], estado_vencimiento: 'vencido' }, initial[0]];
  getPantry.mockResolvedValueOnce(initial).mockResolvedValueOnce(reorderedByBackend).mockResolvedValueOnce([initial[0]]);
  const view = await render(<DespensaScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('Zanahoria')).toBeTruthy());

  await fireEvent.press(view.getByText('Zanahoria'));
  await fireEvent.press(view.getByText('Guardar prueba'));
  await waitFor(() => expect(updatePantryItem).toHaveBeenCalledTimes(1));
  expect(updatePantryItem).toHaveBeenCalledWith('1', expect.objectContaining({ ingrediente: 'Tomate' }));
  await waitFor(() => {
    const rendered = JSON.stringify(view.toJSON());
    expect(rendered.indexOf('Tomate')).toBeLessThan(rendered.indexOf('Zanahoria'));
  });
  expect(view.getByText('Vencido')).toBeTruthy();

  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await fireEvent(view.getByText('Tomate').parent.parent, 'longPress');
  const deleteAction = alert.mock.calls[0][2].find((button) => button.text === 'Eliminar');
  await act(async () => deleteAction.onPress());
  await waitFor(() => expect(deletePantryItem).toHaveBeenCalledWith(2));
  const rendered = JSON.stringify(view.toJSON());
  expect(rendered).not.toContain('Tomate');
  alert.mockRestore();
});

test('[HU-05 CA-04] Inicio muestra plural de ingredientes por vencer y singular de vencidos', async () => {
  getPantrySummary.mockResolvedValue({ por_vencer: 2, vencidos: 1 });
  const view = await render(<RecipeHomeScreen navigation={navigation} />);

  await waitFor(() => {
    expect(view.getByText('Tienes 2 ingredientes por vencer')).toBeTruthy();
    expect(view.getByText('1 ingrediente vencido')).toBeTruthy();
  });
  await fireEvent.press(view.getByText('Tienes 2 ingredientes por vencer'));
  expect(navigation.navigate).toHaveBeenCalledWith('Despensa');
});

test('[HU-05 CA-04] Inicio muestra singular por vencer y plural de vencidos', async () => {
  getPantrySummary.mockResolvedValue({ por_vencer: 1, vencidos: 2 });
  const view = await render(<RecipeHomeScreen navigation={navigation} />);

  await waitFor(() => {
    expect(view.getByText('Tienes 1 ingrediente por vencer')).toBeTruthy();
    expect(view.getByText('2 ingredientes vencidos')).toBeTruthy();
  });
});

test('[HU-05 CA-04] Inicio oculta avisos con resumen vacío o fallido y sigue mostrando sugerencias', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  getPantrySummary.mockResolvedValueOnce({ por_vencer: 0, vencidos: 0 }).mockRejectedValueOnce(new Error('offline'));
  const first = await render(<RecipeHomeScreen navigation={navigation} />);
  await waitFor(() => expect(getPantrySummary).toHaveBeenCalledTimes(1));
  expect(first.queryByText(/por vencer/)).toBeNull();
  expect(first.getByText('Sugerir receta')).toBeTruthy();
  await first.unmount();

  const second = await render(<RecipeHomeScreen navigation={navigation} />);
  await waitFor(() => expect(getPantrySummary).toHaveBeenCalledTimes(2));
  expect(second.queryByText(/por vencer/)).toBeNull();
  expect(second.getByText('Sugerir receta')).toBeTruthy();
  warn.mockRestore();
});

test('[HU-09 CA-02] NutritionCard presenta cuatro filas y segmentos proporcionales a los macros', async () => {
  const view = await render(<NutritionCard recipe={recipe} />);
  expect(view.getByText('250 kcal')).toBeTruthy();
  expect(view.getByText('10 g')).toBeTruthy();
  expect(view.getByText('20 g')).toBeTruthy();
  expect(view.getByText('5 g')).toBeTruthy();
  const segments = view.container.queryAll((node) => node.props.style?.some?.((style) => style?.flexGrow != null));
  expect(segments.map((node) => node.props.style.find((style) => style?.flexGrow != null).flexGrow)).toEqual([10, 20, 5]);
});

test('[HU-09 CA-03] Nutrición nula o parcial usa Sin dato y nunca inventa cero', async () => {
  const partial = await render(<NutritionCard recipe={{ calorias: 0, nutricion: { proteinas_g: null, carbohidratos_g: 3, grasas_g: undefined } }} />);
  expect(partial.getAllByText('Sin dato')).toHaveLength(3);
  expect(partial.queryByText('0 kcal')).toBeNull();
  expect(partial.queryByText('null')).toBeNull();
  expect(partial.queryByText('undefined')).toBeNull();
  expect(JSON.stringify(partial.toJSON())).not.toContain('flexGrow');

  const absent = await render(<NutritionCard recipe={{ calorias: 320, nutricion: null }} />);
  expect(absent.getByText('320 kcal')).toBeTruthy();
  expect(absent.getAllByText('Sin dato')).toHaveLength(3);
});

test('[HU-09 CA-05] NutritionCard contiene el aviso literal de asesoría', async () => {
  const view = await render(<NutritionCard recipe={recipe} />);
  expect(view.getByText('Valores referenciales por porción. No constituyen asesoría médica ni nutricional.')).toBeTruthy();
});

test('[HU-10 CA-04] Faltantes muestra contador, cantidad, unidad y nota cuando existen', async () => {
  const missingRecipe = {
    ...recipe,
    ingredientes_faltantes: [
      { nombre: 'Leche', cantidad: 2, unidad: 'L', nota: 'sin azúcar' },
      { nombre: 'Sal', cantidad: null, unidad: null, nota: 'al gusto' },
    ],
  };
  const view = await render(<RecipeSuggestionScreen navigation={navigation} route={{ params: { recipe: missingRecipe } }} />);
  await fireEvent.press(view.getByRole('tab', { name: 'Faltantes (2)' }));
  await waitFor(() => {
    expect(view.getByText('Leche')).toBeTruthy();
    expect(view.getByText('2 L')).toBeTruthy();
    expect(view.getByText('sin azúcar')).toBeTruthy();
    expect(view.getByText('Sal')).toBeTruthy();
    expect(view.getByText('al gusto')).toBeTruthy();
  });
  expect(view.queryByText('null')).toBeNull();
});

test.each([[], null, undefined])('[HU-10 CA-04] Lista faltante %s muestra el estado de despensa completa', async (missing) => {
  const view = await render(
    <RecipeSuggestionScreen
      navigation={navigation}
      route={{ params: { recipe: { ...recipe, ingredientes_faltantes: missing } } }}
    />
  );
  await fireEvent.press(view.getByRole('tab', { name: 'Faltantes' }));
  await waitFor(() => expect(view.getByText('Tienes todos los ingredientes')).toBeTruthy());
  expect(normalizeMissingIngredients(missing)).toEqual([]);
});

test('[HU-12 CA-01][PR-F-02] El corazón cambia antes de resolverse el POST demorado 2 s', async () => {
  saveFavorite.mockImplementation(() => new Promise((resolve) => {
    setTimeout(() => resolve(savedFavorite), 2000);
  }));
  listFavorites.mockResolvedValue([]);
  const view = await render(<RecipeSuggestionScreen navigation={navigation} route={{ params: { recipe } }} />);
  await waitFor(() => expect(view.getByLabelText('Agregar a favoritos')).toBeTruthy());

  jest.useFakeTimers();
  await fireEvent.press(view.getByLabelText('Agregar a favoritos'));
  const updatedHeart = view.getByLabelText('Quitar de favoritos');
  expect(updatedHeart.props.accessibilityState.disabled).toBe(true);
  expect(saveFavorite).toHaveBeenCalledWith(recipe);
  console.info('[PR-F-02] El corazón cambió mientras el POST de 2000 ms continúa pendiente.');
  await act(async () => jest.advanceTimersByTimeAsync(2000));
  expect(view.getByLabelText('Quitar de favoritos').props.accessibilityState.disabled).toBe(false);
});

test('[HU-12 CA-01] La receta se determina favorita comparando nombres', () => {
  expect(isRecipeFavorite({ nombre: 'Sopa' }, [{ receta: { nombre: 'Sopa' } }])).toBe(true);
});

test('[HU-12 CA-01] Error al guardar revierte el corazón e informa el fallo', async () => {
  saveFavorite.mockRejectedValue(new Error('sin conexión'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = await render(<RecipeSuggestionScreen navigation={navigation} route={{ params: { recipe } }} />);
  await waitFor(() => expect(view.getByLabelText('Agregar a favoritos')).toBeTruthy());

  await fireEvent.press(view.getByLabelText('Agregar a favoritos'));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(view.getByLabelText('Agregar a favoritos').props.disabled).not.toBe(true);
  expect(alert).toHaveBeenCalledWith('No se pudo actualizar', 'sin conexión');
  alert.mockRestore();
});

test('[HU-12 CA-03] FavoritesScreen conserva el orden recibido y muestra el texto vacío exacto', async () => {
  listFavorites.mockResolvedValue([savedFavorite, { ...savedFavorite, id: 'favorite-2', nombre: 'Ensalada' }]);
  const populated = await render(<FavoritesScreen navigation={navigation} />);
  await waitFor(() => expect(populated.getByText('Sopa')).toBeTruthy());
  const populatedMarkup = JSON.stringify(populated.toJSON());
  expect(populatedMarkup.indexOf('Sopa')).toBeLessThan(populatedMarkup.indexOf('Ensalada'));
  await populated.unmount();

  listFavorites.mockResolvedValue([]);
  const empty = await render(<FavoritesScreen navigation={navigation} />);
  await waitFor(() => expect(empty.getByText('Aún no tienes recetas favoritas')).toBeTruthy());
});

test('[HU-12 CA-04] Abrir una favorita muestra la receta guardada y no genera otra receta', async () => {
  listFavorites.mockResolvedValue([savedFavorite]);
  const view = await render(<FavoritesScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('Sopa')).toBeTruthy());
  await fireEvent.press(view.getByText('Sopa'));
  expect(navigation.navigate).toHaveBeenCalledWith('Receta', { recipe });
  expect(generateRecipe).not.toHaveBeenCalled();
});

test('[HU-12 CA-04] Detalle abierto con receta guardada omite la generación de receta', async () => {
  await render(<RecipeSuggestionScreen navigation={navigation} route={{ params: { recipe } }} />);
  expect(generateRecipe).not.toHaveBeenCalled();
});

test.each([
  ['204', undefined],
  ['404', Object.assign(new Error('no existe'), { status: 404 })],
])('[HU-12 CA-05] Eliminar favorita y respuesta %s quitan la fila tras confirmar', async (_status, error) => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  listFavorites.mockResolvedValue([savedFavorite]);
  if (error) deleteFavorite.mockRejectedValue(error);
  else deleteFavorite.mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = await render(<FavoritesScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('Sopa')).toBeTruthy());
  await fireEvent.press(view.getByLabelText('Eliminar Sopa de favoritos'));
  const deleteAction = alert.mock.calls[0][2].find((button) => button.text === 'Eliminar');
  await act(async () => deleteAction.onPress());
  await waitFor(() => expect(view.queryByText('Sopa')).toBeNull());
  alert.mockRestore();
  warn.mockRestore();
});

test('[PR-F-01] Despensa con 200 elementos usa FlatList y se renderiza sin errores', async () => {
  getPantry.mockResolvedValue(Array.from({ length: 200 }, (_, index) => ({
    id: index + 1,
    ingrediente: `Ingrediente ${index + 1}`,
    estado_vencimiento: 'vigente',
  })));
  const startedAt = Date.now();
  const view = await render(<DespensaScreen navigation={navigation} />);
  await waitFor(() => expect(view.getByText('200 ingredientes registrados')).toBeTruthy());
  const elapsedMs = Date.now() - startedAt;
  await expect(getPantry.mock.results[0].value).resolves.toHaveLength(200);
  const pantrySource = readFileSync(resolve(__dirname, './despensa/screens/DespensaScreen.jsx'), 'utf8');
  expect(pantrySource).toMatch(/<FlatList[\s\S]*?data=\{ingredients\}/);
  expect(Number.isFinite(elapsedMs)).toBe(true);
  console.info(`[PR-F-01] 200 elementos entregados a FlatList en ${elapsedMs.toFixed(2)} ms (entorno Jest; no dispositivo).`);
});

test('[PC-F-06] API usa URL configurable y no contiene direcciones IP ni claves fijas', () => {
  const apiSource = readFileSync(resolve(__dirname, '../services/api.ts'), 'utf8');
  expect(apiSource).toContain('process.env.EXPO_PUBLIC_API_BASE_URL');
  expect(apiSource).not.toMatch(/https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/);
  expect(apiSource).not.toMatch(/(?:api[_-]?key|secret)\s*[:=]\s*['"][^'"]{12,}/i);
});

test('[PC-F-07] Inicio registra la pestaña Favoritos y su pantalla de navegación', () => {
  const appSource = readFileSync(resolve(__dirname, '../../App.js'), 'utf8');
  expect(appSource).toContain("Favoritos: <FavoritesScreen navigation={navigation} />");
  expect(appSource).toContain("['Despensa', 'Recetas', 'Favoritos', 'Perfil']");
  expect(appSource).toContain('<Stack.Screen name="AppTabs" component={AppTabs} />');
});
