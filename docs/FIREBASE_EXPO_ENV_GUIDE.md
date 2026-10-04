# Firebase + Expo environment guide

## 1. Qué va en el proyecto

Crea un archivo `.env` en la raíz del proyecto usando los nombres públicos que ya están documentados en [.env.example](../.env.example).

Ejemplo:

```env
EXPO_PUBLIC_API_BASE_URL=http://TU_HOST_DEL_BACKEND:8000
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_publica
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-project.appspot.com
EXPO_PUBLIC_FIREBASE_MSG_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 2. Qué no se debe hacer

- No guardes secretos del backend ni credenciales privadas en `.env` del frontend.
- No copies JSON de cuenta de servicio Firebase en el bundle móvil.
- No compartas valores reales en GitHub, screenshots, documentación pública o chats.

## 3. Cómo funcionan las variables en Expo

Las variables con prefijo `EXPO_PUBLIC_` quedan disponibles en el cliente móvil.

Por eso solo se usan valores públicos del cliente Firebase, como:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## 4. Más seguridad

- Usa `expo-secure-store` para tokens de sesión.
- Guarda el access token del backend en almacenamiento seguro, no como texto plano visible.
- No se deben incluir claves del backend ni secretos de Firebase Admin en el frontend.

## 5. Flujo recomendado

1. Crear la app Firebase web/client.
2. Copiar los valores públicos en `.env`.
3. Reiniciar Expo con `npx expo start --clear`.
4. Cargar la app y comprobar que Firebase se inicializa correctamente.
5. Mantener los secretos del servidor solo en backend/backend administrativo.

## 6. Referencias del proyecto

- [.env.example](../.env.example)
- [src/config/firebase.ts](../src/config/firebase.ts)
- [src/services/api.ts](../src/services/api.ts)
