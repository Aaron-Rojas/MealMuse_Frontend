# Pruebas frontend — Sprint 3

## Alcance y estrategia

El equipo QA verifica las historias HU-05, HU-09, HU-10 y HU-12 del frontend en la rama `sprint3/test`. La batería conserva las ocho pruebas existentes de utilidades con Node y añade pruebas de componente y del cliente API con Jest, `jest-expo` compatible con Expo SDK 57 y React Native Testing Library. Cada solicitud de red usada por las pruebas de componentes o servicios se reemplaza por un mock determinista; no se envían solicitudes desde la batería al backend real.

La validación complementaria ejecuta el chequeo de tipos, Expo Doctor y la exportación Android, todos como comandos de terminación automática. Los resultados se conservan en `evidencia/`; el anexo completo de pruebas Jest se genera a partir del `jest-results.json` producido por esa ejecución. La ejecución no modifica el backend ni acredita flujos visuales en un dispositivo: esas comprobaciones permanecen en [`../QA_SPRINT3.md`](../QA_SPRINT3.md).

## Resultado consolidado

| Ejecución | Pasadas | Fallidas | Suites | Duración / nota |
|---|---:|---:|---:|---|
| Línea base Node, antes de añadir la batería | 8 | 0 | 3 archivos | Ejecución real en `sprint3/test`. |
| Pruebas Node finales | 8 | 0 | 3 archivos | Ver [`node-test.log`](./evidencia/node-test.log). |
| Jest final | 35 | 0 | 2 | 7.028 s con cobertura; ver [`jest.log`](./evidencia/jest.log) y [`jest-results.json`](./evidencia/jest-results.json). |
| Total final de pruebas | **43** | **0** | 5 archivos de pruebas | Suma de las dos ejecuciones, sin duplicar resultados. |
| `npm run typecheck` | Aprobado | 0 | — | [`typecheck.log`](./evidencia/typecheck.log). |
| `npx expo-doctor` | 21/21 | 0 | — | [`expo-doctor.log`](./evidencia/expo-doctor.log). |
| `npx expo export --platform android` | Terminado | 0 | — | Bundle Android Hermes de 2.3 MB; [`expo-export-android.log`](./evidencia/expo-export-android.log). |

### Cobertura Jest

Cobertura agregada por Jest para los seis módulos incluidos en `collectCoverageFrom`. Los porcentajes se calcularon del reporte real de Jest.

| Módulo | Sentencias |
|---|---:|
| `IngredientCard.jsx` | 100.0% |
| `NutritionCard.jsx` | 95.2% |
| `FavoritesScreen.jsx` | 74.6% |
| `RecipeHomeScreen.jsx` | 83.3% |
| `RecipeSuggestionScreen.jsx` | 71.4% |
| `api.ts` | 48.3% |
| **Total ponderado** | **63.64% sentencias; 67.65% funciones; 52.55% ramas; 65.73% líneas** |

## A. Matriz de pruebas unitarias y de componente

| ID y módulo | Escenario | Input / mock | Output esperado | Resultado |
|---|---|---|---|---|
| HU-05 CA-02 · `ExpiryBadge` | Estados `vencido`, `por_vencer`, `vigente` y `sin_fecha`. | Seis combinaciones de `estado_vencimiento` y `dias_para_vencer`. | Etiqueta correcta y tono semántico; la señal no depende solo del color. | PASS |
| HU-05 CA-01/03 · Despensa | Editar y eliminar con respuesta backend en distinto orden. | `getPantry`, `updatePantryItem` y `deletePantryItem` mockeados. | Se conserva el orden recibido después de cada operación, sin recarga manual ni ordenamiento local. | PASS |
| HU-05 CA-04 · Inicio | Singular/plural, conteos cero y fallo del resumen. | Resumen mockeado como `2/1`, `0/0` y rechazo de red. | Avisos con cantidad y gramática; ambos avisos se ocultan si no hay conteo o falla el resumen; Inicio sigue disponible. | PASS |
| HU-09 CA-02 · `NutritionCard` | Cuatro filas y barra nutricional. | Calorías `250`; macros `10`, `20` y `5` g. | Cuatro valores; segmentos con proporción `10:20:5`. | PASS |
| HU-09 CA-03 · `NutritionCard` | Datos parciales y nutrición nula. | Macros `null`/ausentes; calorías heredadas `0` o `320`. | Celdas faltantes muestran “Sin dato”; no se inventa `0`, `null` ni `undefined`; no hay barra parcial. | PASS |
| HU-09 CA-05 · `NutritionCard` | Texto de advertencia. | Receta válida mockeada. | Existe literalmente “Valores referenciales por porción. No constituyen asesoría médica ni nutricional.” | PASS |
| HU-10 CA-04 · Faltantes | Conteo y campos opcionales. | Faltantes con nombre, cantidad, unidad y nota; otros con datos nulos. | Se ven los nombres, contador, unidades/cantidades disponibles y notas; los campos nulos no aparecen como texto. | PASS |
| HU-10 CA-04 · Faltantes | Colección vacía, nula o ausente. | `[]`, `null` y `undefined`. | Aparece “Tienes todos los ingredientes”; el normalizador devuelve lista vacía. | PASS |
| HU-12 CA-01 · Corazón | Guardado optimista, espera y fallo. | POST mockeado con espera de 2 s; luego respuesta exitosa o error. | El corazón cambia antes de resolver; queda deshabilitado durante la petición y revierte el estado ante error. | PASS |
| HU-12 CA-01 · API de favoritas | Creación y duplicado. | Respuestas HTTP 201 con cuerpo y 200 sin cuerpo. | 201 devuelve favorita creada; 200 recupera el registro existente por nombre. | PASS |
| HU-12 CA-03 · `FavoritesScreen` | Orden y estado vacío. | Lista backend `[Sopa, Ensalada]` o lista vacía. | Se conserva el orden recibido y el vacío muestra “Aún no tienes recetas favoritas”. | PASS |
| HU-12 CA-04/05 · Favoritas | Abrir, borrar y aislar la caché. | Receta guardada; DELETE 204/404; sesión expirada/cierre. | Se abre la receta sin llamar a `generate`; ambas respuestas de borrado quitan la fila; cierre/401 limpia favoritas en memoria. | PASS |

## B. Matriz de configuración y errores del cliente

| ID y módulo | Escenario | Input / mock | Output esperado | Resultado |
|---|---|---|---|---|
| PC-F-01 · `api.ts` | URL base y autenticación. | `EXPO_PUBLIC_API_BASE_URL=https://api.test`; SecureStore devuelve token de prueba. | Request a la URL configurada con `Authorization: Bearer …`; la URL es de prueba y no contacta el backend. | PASS |
| PC-F-02 · `api.ts` | Respuestas de validación/no encontrado. | 404 y 422 con `detail`. | El error conserva `status` y mensaje del backend. | PASS |
| PC-F-03 · `api.ts` | Sesión expirada. | 401 después de una lista cacheada. | Token y caché se limpian; se ejecuta el manejador conectado por navegación a Login. | PASS |
| PC-F-04 · `api.ts` | Fallo de conectividad. | `fetch` rechaza con error de red. | El error se propaga; no se presenta una respuesta exitosa simulada. | PASS |
| PC-F-05 · `api.ts` | Timeout. | Reloj Jest y señal abortada a 15 s. | La promesa falla con mensaje explícito de timeout. | PASS |
| PC-F-06 · Configuración | Direcciones y secretos fijos. | Inspección automatizada de `api.ts`. | URL base tomada del entorno; no se encuentran IPs ni claves/secretos literales en el cliente. | PASS |
| PC-F-07 · Navegación | Acceso a Favoritos. | Inspección de rutas/pestañas de `App.js`. | `FavoritesScreen` está conectada a la pestaña **Favoritos** de Inicio. | PASS |
| PC-F-08 · SecureStore | Persistencia del token. | `syncWithBackend` recibe un token de acceso mockeado. | Se llama a `expo-secure-store` con la clave `mealmuse_access_token`. | PASS |
| PC-F-09 · Expo Doctor | Compatibilidad del proyecto. | `npx expo-doctor`. | 21 de 21 comprobaciones aprobadas. | PASS |
| PC-F-10 · Export Android | Bundling de producción. | `npx expo export --platform android`. | Exportación termina y genera bundle Hermes Android de 2.3 MB. | PASS |

## C. Rendimiento

| ID | Tipo | Escenario / protocolo | Resultado obtenido |
|---|---|---|---|
| PR-F-01 | Automatizable | Render de la pantalla con 200 elementos entregados a la `FlatList`; medición con Jest en este equipo. | **32 ms** en el entorno de pruebas. No equivale al tiempo de render en un dispositivo. |
| PR-F-02 | Automatizable | Corazón con POST mockeado de 2.000 ms; Jest avanza el reloj solo después de comprobar el cambio optimista y el bloqueo. | **PASS**: el corazón cambió con la promesa todavía pendiente. No es medición de latencia física. |
| PR-F-03 | Manual | En Expo Go, medir desde el toque hasta el cambio visible del corazón con grabación de pantalla de alta frecuencia o perfilador; repetir 10 veces por dispositivo. | Pendiente de medición manual; sin resultado. |
| PR-F-04 | Manual | Despensa con 200+ ingredientes; recorrer de arriba abajo y vuelta, observar saltos/caídas de frames con perfilador del dispositivo; repetir 5 recorridos. | Pendiente de medición manual; sin resultado. |
| PR-F-05 | Manual | Forzar cierre, abrir desde Expo Go y medir desde inicio hasta pantalla interactiva; 10 arranques en frío por dispositivo. | Pendiente de medición manual; sin resultado. |

## Trazabilidad de criterios de aceptación

| HU / CA | Prueba relacionada | Resultado |
|---|---|---|
| HU-05 CA-01 | `[HU-05 CA-01/03]` — conserva el orden backend. | PASS |
| HU-05 CA-02 | `[HU-05 CA-02]` — etiqueta y color; el estado no se infiere localmente. | PASS |
| HU-05 CA-03 | `[HU-05 CA-01/03]` — edición y eliminación vuelven a consultar la lista. | PASS |
| HU-05 CA-04 | `[HU-05 CA-04]` — avisos, cantidades y fallo del resumen. | PASS |
| HU-05 CA-05 | Contrato del backend, no se modifica desde el frontend. | Pendiente de contraste con OpenAPI; no disponible en esta ejecución. |
| HU-09 CA-02 | `[HU-09 CA-02]` — cuatro filas y proporción de barra. | PASS |
| HU-09 CA-03 | `[HU-09 CA-03]` — faltantes “Sin dato”, sin ceros inventados. | PASS |
| HU-09 CA-05 | `[HU-09 CA-05]` — literal exacto. | PASS |
| HU-10 CA-04 | `[HU-10 CA-04]` — contador, detalle opcional y despensa completa. | PASS |
| HU-12 CA-01 | `[HU-12 CA-01]` — corazón optimista, reversión, nombre y 200/201. | PASS |
| HU-12 CA-03 | `[HU-12 CA-03]` — lista, orden y literal de estado vacío. | PASS |
| HU-12 CA-04 | `[HU-12 CA-04]` — receta guardada no invoca `generate`. | PASS |
| HU-12 CA-05 | `[HU-12 CA-05]` — DELETE 204/404, caché aislada por sesión. | PASS |

## Hallazgos

1. **HU-09 CA-05 — discrepancia corregida:** `NutritionCard` mostraba “Valores referenciales por porción; pueden variar según ingredientes y porciones.” Se cambió al literal exigido: “Valores referenciales por porción. No constituyen asesoría médica ni nutricional.” También se actualizó la guía técnica. Cambio aislado en el commit `da4cfac` (`fix: align nutrition disclaimer with acceptance criteria`).
2. **Compatibilidad Expo:** la primera ejecución de Expo Doctor informó `expo` 57.0.31 frente a 57.0.32 esperado. Se alineó `expo` a `~57.0.32`; la ejecución posterior pasó 21/21.
3. **Infraestructura QA:** antes de esta tarea no había Jest ni React Native Testing Library. Se agregaron `jest-expo`, Jest y React Native Testing Library para cubrir componentes y mocks de API.
4. **Avisos de instalación:** npm informó 22 advisories durante la instalación de dependencias (9 low, 4 moderate, 8 high y 1 critical). No se hizo una remediación de dependencias fuera del alcance ni se presenta ese aviso como un análisis de seguridad.
5. **Backend:** no se modificó ningún archivo del backend. La petición a `/openapi.json` de la URL configurada no estuvo disponible en esta ejecución; por ello no se afirma una verificación actual del contrato.
6. **HU-12 CA-01 — evento de guardado optimista:** los botones de favorito ejecutan la operación asíncrona como fire-and-forget, para que el evento no propague la promesa de red. La prueba con POST demorado confirma que el corazón cambia mientras la solicitud sigue pendiente.

## Pendientes

- Ejecutar la lista manual de [`QA_SPRINT3.md`](../QA_SPRINT3.md) en Expo Go; todos sus resultados quedaron en blanco.
- Medir latencia del corazón, scroll y carga en dispositivo con los protocolos PR-F-03 a PR-F-05.
- Reintentar el contraste con `/openapi.json` cuando el backend configurado esté disponible.
- Revisar por separado los advisories npm si se solicita remediación de seguridad.

## Fragmentos representativos

### Unitario — mapeo de estado

Fuente: [`sprint3.jest.test.jsx`](../../src/modules/sprint3.jest.test.jsx).

```jsx
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
```

### Componente — valores y barra nutricional

Fuente: [`sprint3.jest.test.jsx`](../../src/modules/sprint3.jest.test.jsx).

```jsx
test('[HU-09 CA-02] NutritionCard presenta cuatro filas y segmentos proporcionales a los macros', async () => {
  const view = await render(<NutritionCard recipe={recipe} />);
  expect(view.getByText('250 kcal')).toBeTruthy();
  expect(view.getByText('10 g')).toBeTruthy();
  expect(view.getByText('20 g')).toBeTruthy();
  expect(view.getByText('5 g')).toBeTruthy();
  const segments = view.container.queryAll(
    (node) => node.props.style?.some?.((style) => style?.flexGrow != null)
  );
  expect(segments.map((node) => node.props.style.find((style) => style?.flexGrow != null).flexGrow))
    .toEqual([10, 20, 5]);
});
```

### Servicio — token Bearer y URL configurable

Fuente: [`api.jest.test.js`](../../src/services/api.jest.test.js).

```js
test('[PC-F-01] La URL se obtiene de EXPO_PUBLIC_API_BASE_URL y envía el token Bearer', async () => {
  global.fetch.mockResolvedValue(response(200, { por_vencer: 1, vencidos: 0 }));
  const api = loadApi();
  await api.getPantrySummary();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.test/api/v1/pantry/expiring-summary',
    expect.objectContaining({ headers: expect.objectContaining({}) })
  );
  const headers = global.fetch.mock.calls[0][1].headers;
  expect(headers.get('Authorization')).toBe('Bearer test-token');
});
```

### Rendimiento — cambio optimista durante espera de 2 s

Fuente: [`sprint3.jest.test.jsx`](../../src/modules/sprint3.jest.test.jsx).

```jsx
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
  await act(async () => jest.advanceTimersByTimeAsync(2000));
  expect(view.getByLabelText('Quitar de favoritos').props.accessibilityState.disabled).toBe(false);
});
```

## Anexo A — resultados completos de Jest

Las filas siguientes se generan desde `jest-results.json`; el estado y la duración corresponden al reporte real del último Jest con cobertura.

| ID y modulo | Nombre reportado por Jest | Resultado | Duracion |
|---|---|---:|---:|
| HU-05 CA-02 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-02] ExpiryBadge comunica el estado con etiqueta y tono, no solo color | PASS | 217 ms |
| HU-05 CA-02 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-02] El estado de vencimiento no se recalcula con días cuando falta el estado del backend | PASS | 1 ms |
| HU-05 CA-01/03 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-01/03] Editar y eliminar reflejan el orden recibido del backend sin recargar manualmente | PASS | 1106 ms |
| HU-05 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-04] Inicio muestra plural de ingredientes por vencer y singular de vencidos | PASS | 23 ms |
| HU-05 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-04] Inicio muestra singular por vencer y plural de vencidos | PASS | 18 ms |
| HU-05 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-05 CA-04] Inicio oculta avisos con resumen vacío o fallido y sigue mostrando sugerencias | PASS | 28 ms |
| HU-09 CA-02 - `src/modules/sprint3.jest.test.jsx` | [HU-09 CA-02] NutritionCard presenta cuatro filas y segmentos proporcionales a los macros | PASS | 6 ms |
| HU-09 CA-03 - `src/modules/sprint3.jest.test.jsx` | [HU-09 CA-03] Nutrición nula o parcial usa Sin dato y nunca inventa cero | PASS | 7 ms |
| HU-09 CA-05 - `src/modules/sprint3.jest.test.jsx` | [HU-09 CA-05] NutritionCard contiene el aviso literal de asesoría | PASS | 5 ms |
| HU-10 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-10 CA-04] Faltantes muestra contador, cantidad, unidad y nota cuando existen | PASS | 266 ms |
| HU-10 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-10 CA-04] Lista faltante [] muestra el estado de despensa completa | PASS | 46 ms |
| HU-10 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-10 CA-04] Lista faltante null muestra el estado de despensa completa | PASS | 49 ms |
| HU-10 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-10 CA-04] Lista faltante undefined muestra el estado de despensa completa | PASS | 42 ms |
| HU-12 CA-01/PR-F-02 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-01][PR-F-02] El corazón cambia antes de resolverse el POST demorado 2 s | PASS | 89 ms |
| HU-12 CA-01 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-01] La receta se determina favorita comparando nombres | PASS | 0 ms |
| HU-12 CA-01 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-01] Error al guardar revierte el corazón e informa el fallo | PASS | 50 ms |
| HU-12 CA-03 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-03] FavoritesScreen conserva el orden recibido y muestra el texto vacío exacto | PASS | 19 ms |
| HU-12 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-04] Abrir una favorita muestra la receta guardada y no genera otra receta | PASS | 13 ms |
| HU-12 CA-04 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-04] Detalle abierto con receta guardada omite la generación de receta | PASS | 27 ms |
| HU-12 CA-05 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-05] Eliminar favorita y respuesta 204 quitan la fila tras confirmar | PASS | 15 ms |
| HU-12 CA-05 - `src/modules/sprint3.jest.test.jsx` | [HU-12 CA-05] Eliminar favorita y respuesta 404 quitan la fila tras confirmar | PASS | 13 ms |
| PR-F-01 - `src/modules/sprint3.jest.test.jsx` | [PR-F-01] Despensa con 200 elementos usa FlatList y se renderiza sin errores | PASS | 36 ms |
| PC-F-06 - `src/modules/sprint3.jest.test.jsx` | [PC-F-06] API usa URL configurable y no contiene direcciones IP ni claves fijas | PASS | 1 ms |
| PC-F-07 - `src/modules/sprint3.jest.test.jsx` | [PC-F-07] Inicio registra la pestaña Favoritos y su pantalla de navegación | PASS | 2 ms |
| PC-F-01 - `src/services/api.jest.test.js` | [PC-F-01] La URL se obtiene de EXPO_PUBLIC_API_BASE_URL y envía el token Bearer | PASS | 187 ms |
| HU-12 CA-01 - `src/services/api.jest.test.js` | [HU-12 CA-01] Guardar trata HTTP 201 como creación exitosa | PASS | 18 ms |
| HU-12 CA-01 - `src/services/api.jest.test.js` | [HU-12 CA-01] Guardar trata HTTP 200 sin cuerpo como duplicado y recupera el registro | PASS | 23 ms |
| HU-12 CA-05 - `src/services/api.jest.test.js` | [HU-12 CA-05] DELETE 204 elimina la favorita de la caché | PASS | 20 ms |
| PC-F-08 - `src/services/api.jest.test.js` | [PC-F-08] Token de sesión se persiste con expo-secure-store | PASS | 18 ms |
| HU-12 CA-05 - `src/services/api.jest.test.js` | [HU-12 CA-05] Cerrar sesión limpia la caché en memoria de favoritas | PASS | 19 ms |
| PC-F-02 - `src/services/api.jest.test.js` | [PC-F-02] Error HTTP 404 conserva status y detalle de backend | PASS | 18 ms |
| PC-F-02 - `src/services/api.jest.test.js` | [PC-F-02] Error HTTP 422 conserva status y detalle de backend | PASS | 19 ms |
| PC-F-03 - `src/services/api.jest.test.js` | [PC-F-03] Respuesta 401 elimina token y caché de favoritas y dispara el manejador de Login | PASS | 20 ms |
| PC-F-04 - `src/services/api.jest.test.js` | [PC-F-04] Error de red se propaga sin respuesta exitosa simulada | PASS | 20 ms |
| PC-F-05 - `src/services/api.jest.test.js` | [PC-F-05] Timeout aborta la solicitud y devuelve un error explícito | PASS | 45 ms |
