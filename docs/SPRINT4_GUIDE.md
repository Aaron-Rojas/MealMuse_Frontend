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

## Variables de entorno y Expo

Usar `EXPO_PUBLIC_API_BASE_URL` para el backend y las variables públicas de Firebase ya configuradas. Para Android con Google Maps, configurar `GOOGLE_MAPS_API_KEY` en el entorno local o de EAS. `app.config.js` la lee sin guardar claves en el repositorio.

Ejemplo backend local:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<IP-LAN>:8000"
npx expo start
```

## QA manual pendiente

Consultar `docs/QA_SPRINT4.md`. Las pruebas físicas de ubicación y mapas no se pueden reproducir de forma válida en Jest.

## Archivos incorporados

- `src/services/connectivity.ts`
- `src/services/location.ts`
- `src/services/storesUtils.js`
- `src/modules/geo/screens/LocationSetupScreen.jsx`
- `src/modules/geo/screens/StoresMapScreen.jsx`
- `src/modules/geo/components/StoreRouteSheet.jsx`
- `src/store/cacheStorage.ts`
- `src/store/pantryStore.ts`
- `src/store/favoritesStore.ts`
- `src/store/profileStore.ts`

## Resumen

El Sprint 4 añade ubicación, mapas, rutas, caché persistente por usuario y limpieza de sesión. Las comprobaciones automatizadas deben indicarse con sus resultados reales al cerrar la tarea.
