# Sprint 4 — MealMuse Frontend

## Objetivo del sprint

Este sprint implementa en el frontend móvil:

- **HU-15:** ubicación manual, permiso de ubicación y conectividad.
- **HU-11:** comercios cercanos, mapa, ruta y enlace a Google Maps.
- **HT-01:** caché local por usuario y stores con revalidación stale-while-revalidate.

Se conserva la navegación y las pantallas del Sprint 3. El backend no fue modificado.

## Base y rama

- Rama de trabajo: `sprint-4`.
- Base: rama `sprint3/test`.
- Los cambios se organizan en commits por tarea con prefijos `feat:`, `test:` y `docs:` y referencia `T-XX`.

## Arquitectura

### Servicio HTTP

`src/services/api.ts` concentra Bearer desde `expo-secure-store`, timeouts y errores. Se añadieron:

- `getDistricts`
- `getLocation`
- `updateLocation`
- `getNearbyStores`
- `getStoreRoute`

Los errores conservan `status`, `data` y el texto legible. `getErrorCode(error)` obtiene `error.data.detail.code`.

### Ubicación y conectividad

- `src/services/connectivity.ts` consulta `expo-network` de forma segura.
- `src/services/location.ts` controla el permiso y usa `expo-location`.
- La obtención de coordenadas tiene timeout de 8 segundos.
- Las coordenadas se mantienen solo en memoria y solo se envían como parámetros al backend.

### Mapas

`StoresMapScreen` usa `react-native-maps` cuando está disponible y cae a la lista si el módulo falla. `StoreRouteSheet` presenta distancia, tiempo y enlace a Google Maps.

### Caché local

`src/store/cacheStorage.ts` usa AsyncStorage con claves `mealmuse:{userId}:{recurso}`. Cada entrada contiene `{v, savedAt, data}`, vence a las 24 horas y exige coincidencia de versión de esquema.

Los stores Zustand son:

- `pantryStore.ts`
- `favoritesStore.ts`
- `profileStore.ts`

Cada store expone hidratación, refresh, estado, error y actualizaciones optimistas. El token JWT nunca se escribe en caché.

## HU-15 — Conectividad y ubicación

`LocationSetupScreen` busca distritos por nombre y provincia, permite una dirección de referencia limitada a 255 caracteres y guarda mediante `PUT /api/v1/users/location`.

El mapa revisa conectividad al ganar foco. Si no hay red no solicita permiso ni llama al backend. Desde el mapa se solicita permiso con explicación previa y se usa GPS o ubicación manual, según disponibilidad.

## HU-11 — Comercios cercanos y ruta

`StoresMapScreen` consulta comercios con radio inicial de 1500 m. Los marcadores distinguen tipo con icono y texto. La lista muestra distancia legible y datos referenciales.

Tocar un comercio consulta la ruta, dibuja la polilínea cuando existe y abre `StoreRouteSheet`. `Abrir en Google Maps` usa un enlace profundo sin clave API.

Los estados cubren desconexión, ubicación faltante, carga, lista vacía, ampliación a 3000 m y errores de proveedor.

## HT-01 — Caché por usuario

La limpieza de sesión se registra desde `api.ts` mediante `registerSessionClearListener`. Logout, 401 y fallo de sesión notificado limpian los stores y su caché. El ID proviene de `payload.user.id` o `profile.id` según corresponda.

Los datos cacheados incluyen despensa, resumen, favoritas, perfil y ubicación manual. No se cachean coordenadas GPS, resultados de generar receta, faltantes, comercios ni rutas.

## Contrato del backend

- Distritos: `GET /api/v1/geo/districts`
- Ubicación: `GET/PUT /api/v1/users/location`
- Comercios: `GET /api/v1/stores/nearby`
- Ruta: `GET /api/v1/stores/{store_id}/route`

Todos los endpoints requieren Bearer. Los errores de mapas pueden devolver 503 con `MAPS_QUOTA_EXCEEDED` o `MAPS_NOT_CONFIGURED`, y 502 por fallo del proveedor.

## Errores y UX

- Sin red: estado “Sin conexión” y Reintentar.
- Permiso denegado/GPS apagado/timeout: uso de ubicación manual.
- Sin ubicación manual: acción “Elegir mi distrito”.
- Cuota excedida: mensaje del backend, Reintentar y alternativa de lista.
- Lista vacía: “Ampliar a 3 km”.
- Ningún estado deja la pantalla en blanco.

## Pruebas

Comandos disponibles:

- `npm run typecheck`
- `npm test`
- `npm run test:components`
- `npm run test:all`

Las pruebas Node cubren utilidades puras, incluyendo distancia, tiempo, tipos de comercio, orden y enlace de Google Maps. Jest cubre servicios, componentes existentes y API.

## Validación

Ejecutada el 20 de noviembre de 2026 sobre la rama `sprint-4`.

| Comando | Resultado real |
|---|---|
| `npm run typecheck` | Aprobado. El proceso terminó sin errores de TypeScript. |
| `npm test` | Aprobado. 13 pruebas pasadas y 0 fallidas, incluyendo las 5 pruebas nuevas de `storesUtils`. |
| `npm run test:components` | Aprobado. 52 pruebas pasadas y 0 fallidas en 5 suites Jest. |
| `npm run test:all` | Aprobado. 13 pruebas Node y 52 pruebas Jest pasadas; 0 fallidas. |
| `npx expo-doctor` | Aprobado. 21/21 comprobaciones pasaron y no se detectaron problemas. |
| `npx expo export --platform android` | Aprobado. Metro compiló 921 módulos y exportó el bundle Hermes Android de 2,5 MB a `dist/` junto con `metadata.json`. |

No se ejecutó una prueba visual en dispositivo ni un build Android nativo firmado. Por ello no se verificó físicamente el permiso del sistema, el GPS, el modo avión, los marcadores ni la visualización de Google Maps.

## Variables de entorno y Expo

Usar `EXPO_PUBLIC_API_BASE_URL` para el backend y las variables públicas de Firebase ya configuradas. Para Android con Google Maps, configurar `GOOGLE_MAPS_API_KEY` en el entorno local o de EAS. `app.config.js` la lee sin guardar claves en el repositorio.

`app.json` y `app.config.js` conviven. `app.json` conserva la configuración base de Expo, incluidos el nombre, iconos, permisos de ubicación y `expo-secure-store`. `app.config.js` actúa como configuración dinámica: carga `app.json` como base y agrega o reemplaza el plugin de `react-native-maps` usando `GOOGLE_MAPS_API_KEY` solo cuando la variable de entorno existe. No se escribió ninguna clave en el repositorio.

Ejemplo backend local:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<IP-LAN>:8000"
npx expo start
```

## QA manual pendiente

Consultar `docs/QA_SPRINT4.md`. Las pruebas físicas de ubicación y mapas no se pueden reproducir de forma válida en Jest.

## Archivos incorporados

### Archivos nuevos

- `app.config.js`: configuración dinámica de Expo y clave opcional de Google Maps por entorno.
- `jest.setup.js`: mocks de AsyncStorage, ubicación, red y mapas.
- `docs/QA_SPRINT4.md`: checklist manual de Sprint 4.
- `docs/SPRINT4_GUIDE.md`: esta guía.
- `src/services/connectivity.ts`: consulta segura de conectividad.
- `src/services/location.ts`: permisos y coordenadas con timeout.
- `src/services/storesUtils.js`: utilidades puras de distancia, tiempo, tipos y enlace de Maps.
- `src/services/storesUtils.test.js`: pruebas Node de utilidades de comercios.
- `src/services/connectivity.location.jest.test.js`: conectividad, permiso y coordenadas con mocks.
- `src/services/api.jest.test.js`: ampliado con endpoints geo, query params Bearer y `getErrorCode` 503.
- `src/store/sprint4Stores.jest.test.js`: caché, hidratación, revalidación, rollback, UUID y limpieza.
- `src/modules/geo/sprint4GeoScreens.jest.test.jsx`: ubicación manual, búsqueda, sin red y estado sin ubicación.
- `src/modules/sprint3.jest.test.jsx`: ampliado con la prueba del botón `¿Dónde comprar?`.
- `src/modules/geo/screens/LocationSetupScreen.jsx`: selección y guardado de ubicación manual.
- `src/modules/geo/screens/StoresMapScreen.jsx`: flujo completo de comercios cercanos y ruta.
- `src/modules/geo/components/StoreRouteSheet.jsx`: detalle de comercio y ruta.
- `src/store/cacheStorage.ts`: almacenamiento, TTL y limpieza por usuario.
- `src/store/pantryStore.ts`: estado e caché de despensa y resumen.
- `src/store/favoritesStore.ts`: estado y caché optimista de favoritas.
- `src/store/profileStore.ts`: estado, perfil, alergias y ubicación manual.

### Archivos modificados

- `App.js`: registra las pantallas `Tiendas` y `Ubicacion` en el stack existente.
- `app.json`: incorpora el plugin de `expo-location` y los textos de permiso en español.
- `jest.config.js`: registra `jest.setup.js` y amplía `collectCoverageFrom`.
- `package.json`: agrega las dependencias y scripts del Sprint 4.
- `package-lock.json`: refleja las dependencias instaladas.
- `src/services/api.ts`: agrega endpoints geo, parseo de `detail.message`, `getErrorCode`, limpieza de sesión y aislamiento por usuario.
- `src/modules/despensa/screens/DespensaScreen.jsx`: conecta despensa y resumen al store con caché e hidratación.
- `src/modules/recipes/screens/RecipeHomeScreen.jsx`: muestra nombre, resumen y favoritas desde los stores.
- `src/modules/recipes/screens/FavoritesScreen.jsx`: conecta favoritas al store y conserva estados de carga/error.
- `src/modules/recipes/screens/RecipeSuggestionScreen.jsx`: agrega el botón `¿Dónde comprar?` únicamente con ingredientes faltantes.
- `src/modules/profile/screens/ProfileRestrictionsScreen.jsx`: conecta perfil/alergias al store y agrega la fila `Mi ubicación`.
- `src/modules/sprint3.jest.test.jsx`: agrega el mock mínimo de la nueva API para conservar las pruebas existentes.

## Resumen

El Sprint 4 queda cerrado en el frontend con ubicación manual, mapas, rutas, caché persistente por usuario, limpieza de sesión y favoritos con `favoritesStore` como única fuente de verdad. Los IDs de distrito se manejan como UUID string. La validación automatizada real cerró con 13 pruebas Node y 52 pruebas Jest aprobadas, sin fallos. `expo-doctor` aprobó 21/21 comprobaciones y la exportación Android terminó. Las validaciones físicas de permisos, GPS, mapa y caché entre usuarios permanecen pendientes en dispositivo.
