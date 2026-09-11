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
