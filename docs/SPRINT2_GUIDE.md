# Sprint 2 — MealMuse Frontend

## Objetivo del sprint

Este sprint completa la capa frontend de MealMuse para:

- gestionar restricciones del usuario
- generar recetas a partir de la despensa actual
- mostrar la receta sugerida con preparación e ingredientes
- manejar estados de carga, vacíos, error y sesión expirada
- mantener el flujo coherente con autenticación y navegación existentes

La implementación fue hecha cuidando la arquitectura ya presente en el proyecto y respetando la version de Expo SDK 54/57 y la documentación oficial de Expo.

---

## Alcance implementado

### 1. Perfil y restricciones

Archivo principal:
- [src/modules/profile/screens/ProfileRestrictionsScreen.jsx](../src/modules/profile/screens/ProfileRestrictionsScreen.jsx)

Incluye:
- carga inicial del perfil desde `GET /api/v1/users/profile`
- tratamiento de alergias según los valores permitidos del backend
- toggles para las 8 restricciones soportadas
- guardado con `PUT /api/v1/users/profile`
- manejo de errores 422 y mensajes legibles para el usuario
- recuperación del estado anterior si falla la operación

Valores permitidos:
- Gluten
- Lácteos
- Huevos
- Maní
- Frutos secos
- Soya
- Pescado
- Mariscos

Importante:
- `[]` es válido y significa que el usuario no declaró alergias.
- Se evita afirmar que una receta es “100% segura”.
- Los mensajes refieren a coincidencias con restricciones registradas y revisiones de etiquetas/contaminación cruzada.

### 2. Inicio de recetas

Archivo principal:
- [src/modules/recipes/screens/RecipeHomeScreen.jsx](../src/modules/recipes/screens/RecipeHomeScreen.jsx)

Incluye:
- saludo con nombre del perfil autenticado
- detección de ingredientes próximos a vencer
- tarjeta principal para “Sugerir receta”
- acceso claro a la configuración de restricciones
- carga de despensa y estados vacíos honestos
- flujo de navegación hacia la receta sugerida

### 3. Receta sugerida

Archivo principal:
- [src/modules/recipes/screens/RecipeSuggestionScreen.jsx](../src/modules/recipes/screens/RecipeSuggestionScreen.jsx)

Incluye:
- llamada real a `POST /api/v1/recipes/generate`
- manejo de `422`, `504` y `502`
- visualización de nombre, tiempo, porciones, calorías y pasos
- tabs “Preparación” e “Ingredientes”
- botón “Otra receta” con exclusión del nombre actual
- marca de seguridad prudente basada en `apto_para_alergias`
- manejo de calorías desconocidas con texto no engañoso

### 4. Cliente API centralizado

Archivo principal:
- [src/services/api.ts](../src/services/api.ts)

Responsabilidades:
- base URL configurable por entorno
- token de acceso almacenado con SecureStore
- headers Bearer para llamadas privadas
- plantillas de error centralizadas
- endpoints de:
  - autenticación
  - logout
  - perfil
  - despensa
  - recetas

### 5. Utilidades para restricciones y receta

Archivos:
- [src/services/recipeUtils.js](../src/services/recipeUtils.js)
- [src/services/recipeUtils.test.js](../src/services/recipeUtils.test.js)

Incluye:
- normalización de alergias
- orden de valores según el backend
- etiqueta de calorías segura
- mensajes de seguridad y estado sin exagerar garantías
- pruebas básicas de validación del comportamiento

---

## Navegación del sprint

Archivo principal:
- [App.js](../App.js)

Flujo principal:
- Login
- Register
- AppTabs
- Restricciones
- Receta
- Despensa

Importante:
- la navegación del login y registro lleva al flujo principal autenticado
- la pantalla de restricciones puede abrirse desde el home de recetas o desde la ruta directa del stack
- el acceso a perfil/restricciones es opcional y no bloquea la entrada a la app

---

## Seguridad y tratamiento de datos

Se aplicaron estas buenas prácticas:

- uso de `expo-secure-store` para guardar el token de acceso
- no se almacenan secretos en texto plano
- no se envían alergias en cada llamada de receta; el backend las lee del perfil persistido
- los mensajes no prometen comprobación médica ni “seguridad absoluta”
- se reservan las afirmaciones para “sin coincidencias con tus restricciones registradas” y revisiones de etiquetas

---

## Variables de entorno

Se dejo una plantilla pública en:
- [.env.example](../.env.example)

Variables:
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MSG_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Nunca se almacenan ni se documentan los valores reales dentro del repositorio.

---

## Validación realizada

Se ejecutaron verificaciones reales del proyecto:

- `npm test` → 3 pruebas OK, 0 fallos
- `npm run typecheck` → sin errores
- `npx expo start --clear` → arranque operativo del servidor Expo

La evidencia del arranque quedó en la terminal del proyecto con la salida de Expo disponible para abrir la app desde QR o emulador.

---

## Limitaciones y consideraciones

- El catálogo de recetas depende del backend real y puede ser pequeño o limitado por la configuración local.
- Si el backend no devuelve nutrición verificada, la UI muestra “Calorías sin dato” en lugar de mostrar 0 kcal como dato válido.
- El backend puede devolver 422 cuando no hay una receta compatible; ese estado es manejado como recuperable y no rompe la app.
- Los favoritos se persisten solo localmente, como se indicó en los requisitos del sprint.

---

## Recomendaciones para continuidad

1. Añadir un estado visual de “sin recetas compatibles” más rico, con CTA a revisar despensa y restricciones.
2. Añadir pruebas E2E con Expo/React Native Testing Library para el flujo de login + receta.
3. Revisar si la app necesita un pequeño menú de configuración más avanzado para perfil y notificaciones.
4. Documentar el endpoint real del backend en una guía de entorno por máquina si el equipo trabaja con varios entornos (dev, staging, prod).

---

## Resumen breve

El Sprint 2 deja una base funcional para que el usuario:
- edite sus restricciones
- guarde esas preferencias en el backend
- genere recetas compatibles con su despensa
- revise la receta con pasos e ingredientes
- entienda errores y datos desconocidos sin falsos mensajes de seguridad

Es una versión preparada para integración real con el backend disponible y con la base visual del diseño Figma aplicada con respeto al estilo de la app.
