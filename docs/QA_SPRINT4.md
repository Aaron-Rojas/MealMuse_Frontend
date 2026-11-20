# QA Sprint 4 — Checklist manual

Los siguientes casos quedan pendientes de ejecución en dispositivo. No marcar hasta verificar el flujo real.

## Permisos y conectividad

- [ ] Al abrir la app no se solicita ubicación.
- [ ] Al entrar por primera vez a Tiendas aparece el texto previo y se solicita permiso.
- [ ] Permiso denegado: la app usa ubicación manual guardada.
- [ ] Permiso denegado y sin ubicación manual: aparece “Elegir mi distrito”.
- [ ] GPS apagado: usa ubicación manual si existe.
- [ ] Timeout de ubicación: usa ubicación manual o solicita elegir distrito.
- [ ] Activar modo avión: muestra “Sin conexión” y no solicita permiso ni llama al backend.
- [ ] Reintentar restaura el flujo cuando vuelve la conexión.

## Ubicación manual

- [ ] La lista agrupa o etiqueta distritos por provincia.
- [ ] Buscar funciona por nombre y provincia.
- [ ] La dirección de referencia acepta máximo 255 caracteres.
- [ ] Guardar exitoso muestra confirmación.
- [ ] Un 422 muestra el mensaje del backend.

## Comercios y mapa

- [ ] La lista inicial está ordenada por distancia.
- [ ] Los marcadores muestran ícono y texto distintos para bodega, mercado y supermercado.
- [ ] Los comercios referenciales llevan “Dato referencial”.
- [ ] Sin comercios aparece “Ampliar a 3 km”.
- [ ] Ampliar reconsulta con radio 3000.
- [ ] Si el mapa falla solo se mantiene la lista.
- [ ] La ruta dibuja polilínea y muestra nombre, dirección, distancia y tiempo.
- [ ] “Abrir en Google Maps” abre el enlace de direcciones peatonales.

## Errores de mapas

- [ ] `MAPS_QUOTA_EXCEEDED` muestra el mensaje amable y permite reintentar.
- [ ] `MAPS_NOT_CONFIGURED` muestra el mensaje genérico.
- [ ] 502 muestra el mensaje genérico.
- [ ] 401 retorna al inicio de sesión sin duplicar el manejo.

## Caché y usuarios

- [ ] Con caché disponible, despensa/favoritas/perfil muestran datos de inmediato.
- [ ] Se muestra “Actualizando…” o estado discreto durante revalidación.
- [ ] Sin caché se muestra el spinner completo.
- [ ] Si falla el refresh con caché, se conserva la lista y aparece Reintentar.
- [ ] Logout limpia datos y caché del usuario.
- [ ] Entrar con otro usuario no muestra datos del anterior.
- [ ] Tras 24 horas la caché se descarta.
- [ ] Las coordenadas GPS no aparecen en caché ni en logs.
