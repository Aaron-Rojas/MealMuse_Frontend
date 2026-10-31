# Sprint 3 — MealMuse Frontend

## Objetivo del sprint

Este sprint completa en el frontend móvil las historias:

- **HU-05 — Visibilidad de vencimientos** en Mi Despensa e Inicio.
- **HU-09 — Información nutricional** en el detalle de receta.
- **HU-10 — Ingredientes faltantes** en el detalle de receta.
- **HU-12 — Recetas favoritas** con persistencia en el backend.

La implementación mantiene Expo Go, React Native y `StyleSheet`, conserva la navegación existente y centraliza el acceso HTTP en `src/services/api.ts`. El backend permanece en su propio repositorio y no se modifica desde este frontend.

## Base del trabajo y commits

- Rama de trabajo y rama final: `sprint-3`.
- Base: commit `e6b518e` (rama `Sprint02`, con recetas de Sprint 2 y cliente API).
- Commits funcionales por historia, en orden:
  1. `a147970` — `feat: complete HU-05 pantry expiry visibility`
  2. `328eac9` — `feat: complete HU-09 nutrition card`
  3. `2b62a4b` — `feat: complete HU-10 missing ingredients view`
  4. `d351c0f` — `feat: complete HU-12 favorites and session safety`
- Commits adicionales:
  - `c58a47a` — alinea Expo con el parche admitido por SDK 57.
  - `cf8d39f` — README y checklist de QA manual del sprint.
  - `dc92a5e` — refuerza que el estado de vencimiento solo provenga del campo del backend.

## Arquitectura y responsabilidades

### Servicio HTTP centralizado

**Archivo principal:** [`src/services/api.ts`](../src/services/api.ts)

El servicio concentra:

- La URL base `EXPO_PUBLIC_API_BASE_URL`; el fallback de desarrollo es `http://localhost:8000`.
- El token de acceso almacenado con `expo-secure-store` y el header `Authorization: Bearer …` para endpoints privados.
- Lectura de JSON y transformación uniforme de errores HTTP.
- Timeout por defecto de 15 segundos y un timeout más amplio para generar recetas.
- Limpieza del token y de la caché de favoritas cuando el backend devuelve 401.
- Conversión de fechas y normalización de payloads de despensa.
- Funciones para despensa, recetas y favoritas, evitando llamadas `fetch` directas desde las pantallas.

Funciones relevantes:

| Función | Responsabilidad |
|---|---|
| `getPantry`, `addPantryItem`, `updatePantryItem`, `deletePantryItem` | Leer y mantener la despensa en el backend. |
| `getPantrySummary` | Consultar conteos de elementos por vencer y vencidos. |
| `generateRecipe` | Generar una receta, opcionalmente excluyendo la receta actual. |
| `listFavorites`, `saveFavorite`, `getFavorite`, `deleteFavorite` | Mantener la lista de favoritas y acceder a una receta guardada. |
| `getCachedFavorites`, `clearFavoritesCache` | Reutilizar o limpiar los datos temporales en memoria del usuario actual. |
| `setAuthenticationExpiredHandler` | Permitir a la navegación enviar al usuario a Login cuando vence la sesión. |

### Navegación

**Archivo principal:** [`App.js`](../App.js)

La navegación incorpora la pestaña **Favoritos** junto con Despensa, Recetas y Perfil. La pantalla de favoritos abre el mismo detalle `Receta` que se usa al generar una sugerencia; para ese caso recibe los datos guardados en `route.params.recipe`. El detalle no vuelve a ejecutar `POST /recipes/generate` cuando recibe una receta guardada.

Las pestañas y acciones principales usan roles, estados o etiquetas accesibles y áreas táctiles de al menos 44 puntos donde aplica. El cliente registra un manejador de expiración de sesión que reinicia la pila de navegación en Login.

## HU-05 — Visibilidad de vencimientos

### Mi Despensa

**Archivos principales:**

- [`src/modules/despensa/screens/DespensaScreen.jsx`](../src/modules/despensa/screens/DespensaScreen.jsx)
- [`src/modules/despensa/components/IngredientCard.jsx`](../src/modules/despensa/components/IngredientCard.jsx)
- [`src/modules/despensa/components/AddIngredientModal.jsx`](../src/modules/despensa/components/AddIngredientModal.jsx)
- [`src/shared/components/molecules/ExpiryBadge.jsx`](../src/shared/components/molecules/ExpiryBadge.jsx)
- [`src/services/expiryUtils.js`](../src/services/expiryUtils.js)

La lista se carga desde `GET /api/v1/pantry/`. La pantalla conserva el orden del backend; no ordena ni deriva el estado a partir de la fecha local. El servicio adapta cada elemento y la interfaz presenta estados de carga, error con “Reintentar” y despensa vacía.

El badge lee exclusivamente:

- `estado_vencimiento`: `vencido`, `por_vencer`, `vigente` o `sin_fecha`.
- `dias_para_vencer`: entero o `null`, usado para construir el texto cuando existe.

Los textos son “Vencido hace N días”, “Vence hoy”, “Vence mañana”, “Vence en N días”, “Por vencer” cuando el backend no incluye el número y “Sin fecha”. Se usan colores semánticos del tema y el color se acompaña siempre con texto. Las tarjetas vencidas y por vencer resaltan también con fondo y borde.

Tocar una tarjeta abre el formulario existente con los valores precargados. Guardar crea con POST o edita con PUT y vuelve a consultar el listado; la eliminación confirmada también vuelve a cargarlo. Así se refleja el orden y el estado actuales que devuelva el backend.

### Fechas y unidades

El formulario mantiene el formato de presentación `dd/mm/aaaa`. `normalizePantryPayload` convierte esa entrada a la fecha ISO `YYYY-MM-DD` solicitada por el backend. Al recibir un registro, el servicio prepara también la fecha para volver a abrir el formulario. La pantalla no implementa su propia conversión ni lógica de vencimiento.

Las unidades usadas por la aplicación se normalizan en el servicio, incluyendo `unidad` → `unidades` y alias de litros → `L`. El esquema OpenAPI admite `kg`, `g`, `mg`, `lb`, `oz`, `l`, `L`, `ml`, `unidad`, `unidades` y `piezas`.

### Aviso de Inicio

**Archivo principal:** [`src/modules/recipes/screens/RecipeHomeScreen.jsx`](../src/modules/recipes/screens/RecipeHomeScreen.jsx)

Al ganar foco, Inicio vuelve a solicitar `GET /api/v1/pantry/expiring-summary`. Presenta avisos separados para:

- ingredientes por vencer, con singular y plural, tocable para ir a Despensa;
- ingredientes vencidos;
- ambos conteos en cero, cuando no muestra avisos.

Un error al cargar el resumen se registra y oculta los avisos, sin bloquear Inicio ni la generación de recetas. Las favoritas de Inicio también se refrescan en el mismo foco y muestran carga, error recuperable o estado vacío.

## HU-09 — Información nutricional

**Archivo:** [`src/modules/recipes/components/NutritionCard.jsx`](../src/modules/recipes/components/NutritionCard.jsx)  
**Integración:** [`src/modules/recipes/screens/RecipeSuggestionScreen.jsx`](../src/modules/recipes/screens/RecipeSuggestionScreen.jsx)

El detalle muestra una tarjeta por porción con:

- calorías (`kcal`);
- proteínas, carbohidratos y grasas (`g`);
- una barra proporcional de macronutrientes y una leyenda de texto.

La barra solo se dibuja si los tres macros están presentes y son valores numéricos válidos. Si falta cualquiera, permanece la tabla y sus celdas faltantes dicen “Sin dato”. Cuando `nutricion` es `null`, las calorías heredadas de `calorias` solo se aceptan si son mayores que cero; no se convierte la ausencia en cero.

El pie de la tarjeta conserva exactamente el aviso solicitado: **“Valores referenciales por porción; pueden variar según ingredientes y porciones.”**

## HU-10 — Ingredientes faltantes

**Archivos principales:**

- [`src/modules/recipes/screens/RecipeSuggestionScreen.jsx`](../src/modules/recipes/screens/RecipeSuggestionScreen.jsx)
- [`src/services/favoritesUtils.js`](../src/services/favoritesUtils.js), donde también se normaliza la lista de faltantes.

El detalle ofrece las pestañas Preparación, Ingredientes y Faltantes. La pestaña Faltantes indica el contador cuando es mayor que cero. Cada elemento presenta nombre y nota, si existen; solo presenta cantidad y unidad disponibles. Los campos nulos o ausentes no se representan como texto.

Lista ausente, `null` o vacía equivale a cero faltantes y presenta “Tienes todos los ingredientes”. La lista se toma de la respuesta de generación actual; no se conserva entre generaciones, por lo que un nuevo POST calcula los faltantes a partir de la despensa actual del servidor.

## HU-12 — Recetas favoritas

### Corazón y sincronización

**Archivo principal:** [`src/modules/recipes/screens/RecipeSuggestionScreen.jsx`](../src/modules/recipes/screens/RecipeSuggestionScreen.jsx)

Al enfocar el detalle se consulta la lista actual del usuario (o se inicia con la copia en memoria mientras se refresca). Se identifica una favorita por nombre. El corazón expone la acción correspondiente mediante `accessibilityLabel`, se actualiza inmediatamente y queda deshabilitado mientras se ejecuta la llamada.

- Guardar envía la receta completa a `POST /api/v1/recipes/favorites`.
- Quitar usa el `id` de `FavoriteRead` con `DELETE /api/v1/recipes/favorites/{favorite_id}`.
- Si la solicitud falla, se restaura el estado previo y se informa el error.
- Si el DELETE devuelve 404, se considera que la favorita ya no existe y se mantiene quitada.

### Pantalla Mis favoritas

**Archivo:** [`src/modules/recipes/screens/FavoritesScreen.jsx`](../src/modules/recipes/screens/FavoritesScreen.jsx)

La pantalla consulta y conserva el orden de backend. Cada fila muestra el nombre y los datos disponibles (tiempo y calorías). Contiene:

- carga visible;
- error con opción “Reintentar”;
- mensaje “Aún no tienes recetas favoritas” y acción para ir a Inicio;
- apertura de la receta guardada desde `FavoriteRead.receta`, o lectura por ID si hiciera falta;
- eliminación con confirmación; tras 204 o 404 se quita la fila.

La persistencia vive en backend. La caché local es solo en memoria para el usuario en sesión. Se borra al cerrar sesión, sincronizar otra sesión o recibir un 401. Al expirar el token, se cierra la sesión de Firebase cuando existe y la navegación vuelve a Login.

## Contrato del backend verificado

Se consultó el OpenAPI del backend disponible en el entorno de desarrollo. Los valores de URL no se guardan en esta guía ni en el código.

### Despensa

- `GET /api/v1/pantry/` devuelve una lista de `PantryItemRead`, incluyendo `id`, `ingrediente`, `cantidad`, `unidad`, `fecha_caducidad`, `estado_vencimiento` y `dias_para_vencer`.
- `POST /api/v1/pantry/` y `PUT /api/v1/pantry/{item_id}` devuelven también `PantryItemRead`.
- La fecha es `date` y viaja como `YYYY-MM-DD` o `null`.
- `GET /api/v1/pantry/expiring-summary` se declara como un objeto con valores enteros; el frontend consume `por_vencer` y `vencidos`, como establece el contrato funcional.

### Recetas

`RecipeRead` expone `nombre`, `tiempo_estimado_minutos`, `porciones`, `calorias`, ingredientes, pasos y `apto_para_alergias`. Nutrición es nullable y contiene `calorias_kcal`, `proteinas_g`, `carbohidratos_g` y `grasas_g`; faltantes pueden incluir `nombre`, `cantidad`, `unidad` y `nota`.

### Favoritas

- `FavoriteCreate` recibe el objeto de receta completo como cuerpo, no `{ receta: ... }`.
- `FavoriteRead` contiene `id`, `nombre`, `receta` y `fecha_guardado`.
- El POST declara `201` con `FavoriteRead` cuando se crea; el `200` de duplicado no declara cuerpo. Para ese caso el servicio vuelve a consultar la lista y busca el mismo nombre para recuperar el ID.
- GET devuelve la lista y GET por ID devuelve el favorito; DELETE devuelve 204 o 404 según exista.

La rama no incorpora código ni modificaciones al backend.

## Errores y experiencia de usuario

- **401:** el servicio limpia token y caché de favoritas, cierra la sesión Firebase si procede y vuelve a Login.
- **404 al quitar favorito:** se retira de la interfaz porque ya no existe en backend.
- **422 en generación:** se conserva el tratamiento de Sprint 2 para recetas incompatibles con despensa/restricciones; no se rompe el flujo existente.
- **Errores de red y timeout:** los errores se propagan desde el servicio para que la interfaz informe al usuario. La generación usa un plazo mayor que las solicitudes normales.
- **Carga, error y vacío:** despensa y Mis favoritas muestran estados visibles y acciones de recuperación. Inicio no queda bloqueado por un error del resumen.
- **Accesibilidad:** estado de vencimiento comunicado con texto; acciones sin texto tienen etiquetas; navegación y botones principales tienen superficies táctiles ampliadas.

## Pruebas y comprobaciones

No hay una infraestructura de Jest ni React Native Testing Library en este proyecto. Se añadieron pruebas pequeñas con Node para utilidades puras:

- mapeo de vencimiento y rechazo de cualquier inferencia local;
- normalización de faltantes, listas nulas y cantidades cero;
- utilidades existentes de alergias, calorías y mensajes de seguridad.

Validación ejecutada en la rama final:

| Comando | Resultado |
|---|---|
| `npm test` | 8 pruebas aprobadas, 0 fallidas. |
| `npm run typecheck` | Aprobado. |
| `npx expo-doctor` | 21/21 comprobaciones aprobadas. |
| `npx expo export --platform android` | Bundle Android generado correctamente; no inicia un servidor de desarrollo. |
| `git diff --check` | Sin errores de whitespace. |

No se ejecutó `npx expo start` durante la reanudación, conforme a la instrucción de evitar un servidor interactivo que pueda congelar VS Code. Las pruebas visuales y con sesión real en Expo Go siguen siendo manuales.

## Variables de entorno y Expo

La base del backend se configura con `EXPO_PUBLIC_API_BASE_URL`. Las variables públicas de Firebase usadas por la app se leen desde el entorno local. No se debe registrar una URL personal, tokens ni claves secretas en el repositorio.

El proyecto usa Expo SDK 57. La versión de `expo` se alineó a `~57.0.31` porque `expo-doctor` indicó que ese parche era el requerido por el SDK instalado. No se añadieron dependencias nuevas. La instalación informó advisories de npm; no se ejecutó una actualización automática forzada de paquetes ajenos al alcance.

## QA manual pendiente

La integración de backend se contrastó con OpenAPI y el bundle se exportó, pero no se realizaron flujos autenticados en un dispositivo. Antes de considerar el sprint probado de extremo a extremo, ejecutar la lista de [`docs/QA_SPRINT3.md`](./QA_SPRINT3.md), especialmente:

1. Login y estados/orden de despensa.
2. Edición de fecha y actualización de orden desde el backend.
3. Avisos de Inicio y navegación a despensa.
4. Receta con macros completos, nulls y faltantes nulos.
5. Guardar, quitar, eliminar, abrir y persistir favoritas.
6. Estado vacío, errores de red, timeout y sesión 401.

## Archivos incorporados por Sprint 3

```text
App.js
README.md
docs/QA_SPRINT3.md
package.json
package-lock.json
src/modules/despensa/components/AddIngredientModal.jsx
src/modules/despensa/components/IngredientCard.jsx
src/modules/despensa/screens/DespensaScreen.jsx
src/modules/recipes/components/NutritionCard.jsx
src/modules/recipes/screens/FavoritesScreen.jsx
src/modules/recipes/screens/RecipeHomeScreen.jsx
src/modules/recipes/screens/RecipeSuggestionScreen.jsx
src/services/api.ts
src/services/expiryUtils.js
src/services/expiryUtils.test.js
src/services/favoritesUtils.js
src/services/favoritesUtils.test.js
src/shared/components/molecules/ExpiryBadge.jsx
src/theme/colors.js
```

## Resumen

Sprint 3 completa la lectura de vencimientos desde el backend, el alta/edición/eliminación sincronizadas de despensa, los avisos de Inicio, la tarjeta nutricional, la vista de faltantes y la gestión persistente de favoritas. Se conserva una única capa de servicios, el diseño existente y el soporte de Expo Go. La validación automatizada pasó; la revisión final en un dispositivo Expo Go queda pendiente y está descrita paso a paso en el checklist QA.
