# Contrato API de nomada

Todas las escrituras usan JSON y el encabezado `Origin` igual a PUBLIC_ORIGIN.
En un navegador servido por Node se añade automáticamente. La cookie de sesión
se envía con `credentials: 'same-origin'`; no se almacena un token en localStorage.
Errores: `{ "error": "mensaje" }`. Estados comunes: 400 validación, 401 sin
sesión, 403 sin permiso, 404 recurso no visible, 409 conflicto.

## Acceso

| Método | Ruta | Contenido |
|---|---|---|
| POST | /api/registro | nombre, email, password de 12 a 128 caracteres, rol huesped o anfitrion |
| POST | /api/login | email, password |
| POST | /api/logout | {} |
| GET | /api/yo | Cuenta autenticada |
| PUT | /api/perfil | nombre, telefono, ciudad. No cambia rol ni correo |
| GET | /api/config | serviceFeeBps, cancelBeforeArrival |
| GET | /api/salud | Disponibilidad de PostgreSQL |

## Alojamientos y anfitrión

| Método | Ruta | Uso |
|---|---|---|
| GET | /api/alojamientos | Catálogo público. Filtros q, categoria, personas, entrada, salida, precioMax y offset. Hasta 100 por consulta |
| GET | /api/alojamientos/:id | Detalle publicado y reseñas visibles |
| POST | /api/alojamientos | Crear, solo anfitrión |
| PUT | /api/alojamientos/:id | Reemplazar información, solo propietario |
| GET | /api/anfitrion/panel | Alojamientos, reservas, bloqueos, reseñas y notificaciones propios |
| POST | /api/bloqueos | alojamientoId, entrada, salida. Solo propietario |
| DELETE | /api/bloqueos/:id | Liberar bloqueo propio |

Contenido para crear/editar un alojamiento:

```json
{
  "titulo": "Casa en Toluca",
  "descripcion": "Descripción del espacio",
  "ubicacion": "Toluca, Estado de México",
  "categoria": "all",
  "precio": "1500.25",
  "capacidad": 4,
  "servicios": ["Wi-Fi", "Cocina"],
  "caracteristicas": "Jardín",
  "fotos": [],
  "publicado": true
}
```

Fotos: hasta 5 cadenas data URL PNG/JPEG de máximo 500 KB cada una.
Las fotografías se almacenan en JSONB para esta entrega académica; antes de
escalar se recomienda migrar a almacenamiento de objetos y conservar referencias.

## Huésped, reservas y pagos

| Método | Ruta | Uso |
|---|---|---|
| GET | /api/huesped/panel | Cuenta, catálogo, viajes, favoritos, reseñas y avisos |
| PUT | /api/favoritos/:alojamientoId | Guardar favorito propio |
| DELETE | /api/favoritos/:alojamientoId | Quitar favorito propio |
| POST | /api/reservas | Solicitar, solo huésped |
| GET | /api/reservas | Reservas propias del huésped o recibidas por el anfitrión |
| PATCH | /api/reservas/:id/estado | {"estado":"confirmada"}, rechazada, cancelada o finalizada, según permisos y transición |
| POST | /api/reservas/:id/pago | {"resultado":"aprobado"} o rechazado. Solo titular y reserva confirmada |
| GET | /api/reservas/:id/comprobante | Operación privada del huésped o propietario |
| POST | /api/resenas | reservaId, puntuacion de 1 a 5, comentario. Solo titular tras finalizar |
| GET | /api/notificaciones | Avisos de la cuenta |
| PATCH | /api/notificaciones | Marcar todos los avisos propios como leídos |

Solicitud de reserva:

```json
{
  "alojamientoId": "UUID_DEL_ALOJAMIENTO",
  "entrada": "2026-12-10",
  "salida": "2026-12-13",
  "personas": 2,
  "notas": "Llegada aproximada a las 16 horas",
  "claveOperacion": "UUID_GENERADO_POR_EL_CLIENTE"
}
```

La identidad, precio, tarifa e importe no se aceptan del cliente: los determina
el servidor. Reutiliza la clave al reintentar la misma operación; si cambias
fechas, alojamiento, personas o notas, genera otra clave.

Transiciones:

- Anfitrión: pendiente a confirmada/rechazada antes de la entrada o el mismo día.
- Huésped: pendiente a cancelada.
- Anfitrión: confirmada a finalizada después de la salida.
- Confirmada a cancelada solo si la configuración permite cancelación previa.
- Pago: rechazado puede reintentarse como aprobado. Un aprobado no se degrada
  por un reintento; se devuelve el mismo pago. No se cobran tarjetas reales.

Las fechas son días civiles; las operaciones usan America/Mexico_City para
determinar el día actual. Las notificaciones conservan fecha/hora timestamptz.

## Administración lista para una futura interfaz

Todas las rutas requieren una cuenta administrador activa. Las consultas aceptan
`limit` de 1 a 500 y `offset`.

| Método | Ruta | Uso |
|---|---|---|
| GET | /api/admin/resumen | Conteos y suma de pagos simulados aprobados |
| GET | /api/admin/usuarios | Cuentas sin hashes ni secretos |
| PATCH | /api/admin/usuarios/:id | {"activo":false} o {"activo":true,"rol":"huesped"} |
| GET | /api/admin/alojamientos | Supervisión |
| PATCH | /api/admin/alojamientos/:id | {"moderado":true} para ocultar o false para levantar moderación |
| GET | /api/admin/reservas | Seguimiento |
| GET | /api/admin/pagos | Operaciones simuladas |
| GET | /api/admin/resenas | Contenido |
| PATCH | /api/admin/resenas/:id | {"visible":false} o true |
| GET | /api/admin/auditoria | Bitácora de acciones de la aplicación |

Modificar una cuenta revoca sus sesiones. No se permite quitar el propio acceso
administrativo ni dejar al sistema sin un administrador activo. No se cambia
el rol de una cuenta que posee alojamientos. El administrador no borra historial
ni modifica directamente el importe de una reserva o un pago.

La bitácora de aplicación no contiene los logs SQL de pgAudit. Esos se consultan
con las herramientas de administración de PostgreSQL y permisos separados.
