# QA manual — Sprint 3

No hay Jest/React Native Testing Library configurado. El proyecto conserva pruebas ligeras de Node para los mapeos y normalizadores puros (`npm test`); los flujos de pantalla deben comprobarse manualmente en Expo Go con el backend activo.

**Estado de ejecución:** pendiente de la prueba manual del usuario en Expo Go. En esta reanudación se validó el contrato publicado por `/openapi.json`, pero no se inició Metro ni se ejecutaron flujos autenticados en un dispositivo.

## HU-05 — Despensa y vencimientos

| Paso | Resultado esperado |
|---|---|
| Iniciar sesión con una despensa que incluya productos vencidos, que vencen hoy, en 1–3 días, vigentes y sin fecha. | Se conserva el orden recibido del backend. Cada tarjeta muestra una etiqueta de texto correcta además del color: “Vencido hace N días”, “Vence hoy”, “Vence mañana”, “Vence en N días” o “Sin fecha”. |
| Abrir el formulario de un ingrediente existente tocando su tarjeta. | El formulario se precarga con nombre, cantidad, unidad y fecha de caducidad. |
| Cambiar la fecha de caducidad y guardar. | Se envía `PUT`; la despensa vuelve a consultar `GET /pantry/` y refleja el orden y estado nuevos devueltos por el backend. |
| Crear y eliminar un ingrediente. | La lista se recarga desde el backend después de cada operación y el contador coincide con sus registros. |
| Abrir Inicio con conteos de resumen mayores que cero. | Los avisos por vencer y vencidos son independientes; el aviso por vencer navega a Mi Despensa y singular/plural concuerdan con el conteo. |
| Repetir Inicio con ambos conteos en cero y luego con el endpoint de resumen inaccesible. | No se muestra ningún aviso; un fallo del resumen no bloquea Inicio ni impide generar recetas. |

## HU-09 — Información nutricional

| Paso | Resultado esperado |
|---|---|
| Generar una receta con todos los macros presentes. | La tarjeta muestra calorías, proteínas, carbohidratos y grasas por porción; la barra y leyenda conservan proporciones relativas a los gramos. |
| Probar cada macro como `null` y la nutrición completa como `null`. | No se muestra la barra si falta cualquier macro. Cada dato faltante indica “Sin dato”; solo se muestran calorías heredadas si son mayores que cero y `nutricion` completa es `null`. |
| Probar combinaciones mixtas de valores nulos y disponibles. | La pantalla no muestra `null`, `undefined` ni `NaN` y no falla al renderizar. |
| Revisar el pie de la tarjeta. | Aparece exactamente: “Valores referenciales por porción; pueden variar según ingredientes y porciones.” |

## HU-10 — Ingredientes faltantes

| Paso | Resultado esperado |
|---|---|
| Generar receta con varios ingredientes faltantes. | La pestaña muestra el contador y cada nombre, cantidad/unidad solo cuando existen y la nota cuando viene informada. |
| Probar faltantes con cantidad y unidad `null`. | Se muestra solo el nombre y, si existe, la nota; no aparecen valores `null` o `undefined`. |
| Probar lista vacía, ausente y `null`. | La lista se trata como vacía y aparece “Tienes todos los ingredientes”; el contador es cero u omitido. |
| Cambiar la despensa y generar otra receta. | Se muestra la lista de la respuesta nueva; no se reutiliza una lista anterior. |

## HU-12 — Favoritas

| Paso | Resultado esperado |
|---|---|
| Abrir el detalle de una receta ya guardada. | El corazón aparece relleno; el estado accesible dice “Quitar de favoritos”. |
| Guardar y quitar una receta. | El corazón cambia inmediatamente, se envía el cuerpo completo de receta al backend y se conserva el `id` devuelto; al quitar, se usa `DELETE`. |
| Tocar repetidamente el corazón durante la solicitud. | El control se deshabilita y solo se procesa una operación. |
| Simular fallo de red al guardar o quitar. | El estado visual se revierte y se informa el error. |
| Abrir Mis favoritas con registros. | Se conserva el orden más reciente a más antiguo del backend y se muestra nombre y datos disponibles. |
| Abrir una favorita. | Se presenta su receta guardada; no se envía `POST /recipes/generate`. |
| Eliminar desde la lista y confirmar; repetir con un id inexistente (404). | La fila se quita tras la confirmación, tanto con respuesta 204 como con 404. |
| Probar usuario sin favoritas y backend inaccesible. | Se muestra el estado vacío con acceso a Inicio, o el error con botón “Reintentar”, respectivamente. |
| Cerrar sesión y entrar con la misma cuenta; después repetir con otra cuenta. | Las favoritas persisten en backend para la misma cuenta y la caché en memoria no se muestra a la otra cuenta. |
| Expirar la sesión (401). | La app limpia la sesión, regresa a Login y no conserva favoritas en memoria. |

## Verificaciones automáticas ejecutables

- `npm test`
- `npm run typecheck`
- `npx expo-doctor`
- `npx expo export --platform android`

No ejecutar `npx expo start` como parte de esta guía; la comprobación visual de Expo Go corresponde a la prueba manual anterior.
