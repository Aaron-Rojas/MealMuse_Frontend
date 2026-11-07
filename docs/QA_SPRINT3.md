# Checklist manual de QA — Sprint 3

Completar en Expo Go con el backend disponible. No se registran resultados automatizados ni se marcan casos como aprobados en esta lista.

| ID / HU | Pasos en Expo Go | Resultado esperado | Resultado manual |
|---|---|---|---|
| HU-05 | Iniciar sesión y abrir **Despensa** con ingredientes vencidos, por vencer, vigentes y sin fecha. | Se conserva el orden recibido del backend; cada producto muestra etiqueta y color del estado correcto. | [ ] |
| HU-05 | Editar la fecha de vencimiento de un producto y guardar. | El estado y orden cambian con la respuesta actualizada, sin cerrar ni recargar manualmente la pantalla. | [ ] |
| HU-05 | Volver a **Inicio** con ingredientes por vencer y vencidos. Tocar el aviso por vencer. | Aparecen los avisos con cantidad y singular/plural correctos; el aviso por vencer abre Despensa. | [ ] |
| HU-09 / HU-10 | Desde Inicio generar una receta. Revisar la tarjeta nutricional y abrir la pestaña **Faltantes**. | Se muestran las cuatro filas nutricionales; cada dato nulo dice “Sin dato”; el aviso es “Valores referenciales por porción. No constituyen asesoría médica ni nutricional.” La pestaña muestra faltantes o “Tienes todos los ingredientes”. | [ ] |
| HU-12 | En el detalle tocar el corazón para guardar y volver a tocarlo para quitar la receta. | El corazón cambia de inmediato; el estado final coincide con el backend y los errores se muestran sin dejar estado incorrecto. | [ ] |
| HU-12 | Guardar una receta, cerrar sesión y volver a entrar con la misma cuenta. | La receta continúa en **Mis favoritas**. | [ ] |
| HU-12 | Entrar con un usuario que no tiene favoritas y abrir **Mis favoritas**. | Aparece “Aún no tienes recetas favoritas”. | [ ] |
| HU-05 / HU-12 | Apagar o desconectar el backend y abrir Despensa y Mis favoritas. | La aplicación no se cae; cada pantalla muestra un error recuperable con **Reintentar**. | [ ] |

## Registro de ejecución en dispositivo

| Campo | Completar durante la prueba |
|---|---|
| Dispositivo y modelo | |
| Sistema operativo / versión | |
| Versión de Expo Go | |
| Fecha y hora | |
| Usuario de prueba (sin contraseña ni token) | |
| Observaciones / incidencias | |

**Estado:** pendiente de verificación manual en dispositivo. Las casillas se dejan en blanco para completar durante la ejecución real.
