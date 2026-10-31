# MelMuse - Frontend Mobile (Sprint 1 Completado)

Aplicación móvil desarrollada en **React Native** con **Expo** (JavaScript puro y estilos nativos mediante `StyleSheet`), diseñada para una compatibilidad total con **Expo Go**.

---

## 🎯 Resumen del Sprint 1: Arquitectura y CRUD de Despensa

### 1. Sistema de Diseño y Tokens (`src/theme/colors.js`)
- Tokens cromáticos extraídos con fidelidad de los prototipos Figma de **MealMuse**:
  - `primary`: `#2E9461` (Verde esmeralda para botones principales, badges y enlaces).
  - `background.main`: `#FBFBFA` (Fondo marfil suave de pantalla).
  - `text.primary`: `#1A2530` (Títulos y etiquetas de alto contraste).
  - `error.background` & `error.text`: `#FDE8E8` / `#E02424` (Banners de error y alertas destructivas).

### 2. Átomos y Moléculas Reutilizables (`src/shared/components/`)
- `FloatingActionButton.jsx`: Botón flotante (`+`) posicionado con `position: 'absolute'`, `bottom: 30`, `right: 20`, elevación y sombras nativas.
- `InitialAvatar.jsx`: Círculo con fondo suave y la primera letra del ingrediente en verde corporativo.
- `ExpiryBadge.jsx`: Píldora de vencimiento dinámica con semántica tricolor (Rojo: `≤ 3 días`, Amarillo: `4 - 7 días`, Verde: `> 7 días`).
- `PrimaryButton.jsx`: Botón principal sólido con feedback táctil y estado de carga.
- `CustomInput.jsx`: Campo de texto nativo con estados de foco, bordes de error e íconos a la derecha.

### 3. Módulo Auth (`src/modules/auth/screens/`)
- `LoginScreen.jsx`: Vista de inicio de sesión conectada con navegación hacia `Register` y transición limpia con `navigation.replace('Despensa')`.
- `RegisterScreen.jsx`: Formulario de registro con validaciones de contraseña, header personalizado con retorno (`‹`) e indicador de cifrado.

### 4. Módulo Despensa y Preparación API (`src/modules/despensa/`)
- `DespensaScreen.jsx`:
  - **Cerrar Sesión:** `navigation.replace('Login')` para destruir el historial de navegación.
  - **Eliminar Ingrediente:** `onLongPress` en tarjeta + `Alert.alert` destructivo para filtrar del estado.
  - **Lista Virtualizada:** `<FlatList>` nativo con contador reactivo y botón de búsqueda.
- `AddIngredientModal.jsx`:
  - **Contrato de Datos Centralizado:** `{ nombre, cantidad, unidad, fechaVencimiento }`.
  - **Validaciones Preventivas:** Validación en cliente antes del envío con mensajes de error individuales en rojo.
  - **Esqueleto HTTP Preparado:** Estructura con `fetch` nativo lista para el endpoint `POST /api/v1/ingredientes`.

---

## 📁 Estructura del Proyecto

```text
MelMuse/
└── frontend/
    ├── assets/
    ├── src/
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── components/
    │   │   │   └── screens/
    │   │   │       ├── LoginScreen.jsx
    │   │   │       └── RegisterScreen.jsx
    │   │   └── despensa/
    │   │       ├── components/
    │   │       │   ├── AddIngredientModal.jsx
    │   │       │   └── IngredientCard.jsx
    │   │       └── screens/
    │   │           └── DespensaScreen.jsx
    │   ├── shared/
    │   │   └── components/
    │   │       ├── atoms/
    │   │       │   ├── CustomInput.jsx
    │   │       │   ├── FloatingActionButton.jsx
    │   │       │   ├── InitialAvatar.jsx
    │   │       │   ├── OutlineButton.jsx
    │   │       │   └── PrimaryButton.jsx
    │   │       └── molecules/
    │   │           ├── ExpiryBadge.jsx
    │   │           └── FormField.jsx
    │   └── theme/
    │       └── colors.js
    ├── App.js
    ├── app.json
    └── package.json
```

---

## 🚀 Comandos de Instalación y Ejecución

### 1. Instalación de Dependencias Sincronizadas
```bash
cd frontend
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

### 2. Ejecución con Expo Go
```bash
# Iniciar servidor de desarrollo Metro limpiando la caché
npx expo start -c
```
Escanea el código QR desde la app **Expo Go** en tu dispositivo físico (Android/iOS) o presiona `a` para emulador Android / `w` para versión Web.

---

## 💡 Contrato de Datos e Integración Backend (Sprint 2)

### Payload del Ingrediente
```json
{
  "nombre": "Palta",
  "cantidad": "2",
  "unidad": "unidades",
  "fechaVencimiento": "25/09/2026"
}
```

### Buenas Prácticas para el Servicio API
- Crear un cliente HTTP centralizado en `src/services/api.js` (o `src/shared/api/httpClient.js`) que maneje `baseUrl`, headers por defecto e intercepción de tokens de autenticación.

---

## 📘 Documentación del Sprint 2

La implementación del sprint 2 quedó documentada en:
- [docs/SPRINT2_GUIDE.md](docs/SPRINT2_GUIDE.md)

Ese documento incluye:
- objetivos del sprint
- arquitectura y navegación implementada
- lista de pantallas y componentes principales
- contratos del backend que consume la app
- variables de entorno necesarias
- validación ejecutada y limitaciones conocidas
- recomendaciones para continuidad

La guía está pensada para que el equipo pueda mantener y ampliar la funcionalidad sin perder contexto ni repetir decisiones del diseño o la integración.

---

## Sprint 3: vencimientos, recetas y favoritas

### Funcionalidad incluida

- **HU-05 — Visibilidad de vencimientos:** la despensa consume la lista ordenada por el backend, muestra sus estados sin recalcular fechas, permite crear/editar/eliminar ingredientes y vuelve a cargar los datos. Inicio muestra el resumen de ingredientes por vencer y vencidos.
- **HU-09 — Información nutricional:** el detalle de receta muestra calorías y macronutrientes por porción; los valores ausentes se presentan como “Sin dato” y la barra solo aparece con los tres macros disponibles.
- **HU-10 — Ingredientes faltantes:** el detalle incluye la pestaña Faltantes, cantidades/unidades solo cuando existen, notas del backend y un estado positivo cuando no faltan ingredientes.
- **HU-12 — Recetas favoritas:** guardar/quitar desde el detalle, lista persistida por usuario en el backend, apertura del detalle guardado y eliminación con confirmación.

### Archivos principales

```text
src/
├── modules/
│   ├── despensa/
│   │   ├── components/
│   │   │   ├── AddIngredientModal.jsx
│   │   │   └── IngredientCard.jsx
│   │   └── screens/DespensaScreen.jsx
│   └── recipes/
│       ├── components/NutritionCard.jsx
│       └── screens/
│           ├── FavoritesScreen.jsx
│           ├── RecipeHomeScreen.jsx
│           └── RecipeSuggestionScreen.jsx
├── services/
│   ├── api.ts
│   ├── expiryUtils.js
│   └── favoritesUtils.js
└── shared/components/molecules/ExpiryBadge.jsx
```

### Endpoints consumidos

- `GET /api/v1/pantry/`, `POST /api/v1/pantry/`, `PUT /api/v1/pantry/{item_id}`, `DELETE /api/v1/pantry/{item_id}`
- `GET /api/v1/pantry/expiring-summary`
- `POST /api/v1/recipes/generate`
- `GET /api/v1/recipes/favorites`, `POST /api/v1/recipes/favorites`
- `GET /api/v1/recipes/favorites/{favorite_id}`, `DELETE /api/v1/recipes/favorites/{favorite_id}`

Todas las llamadas HTTP se centralizan en `src/services/api.ts`. La URL base se configura mediante `EXPO_PUBLIC_API_BASE_URL`; no debe almacenarse una URL personal en el repositorio.

Los pasos de validación manual para Expo Go y los resultados esperados están en [docs/QA_SPRINT3.md](docs/QA_SPRINT3.md).

La guía técnica completa del sprint, con las historias, contratos del backend, decisiones de implementación y validación, está en [docs/SPRINT3_GUIDE.md](docs/SPRINT3_GUIDE.md).
