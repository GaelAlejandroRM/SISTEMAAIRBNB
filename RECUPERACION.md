# Recuperación de cuentas

El usuario abre Acceso → ¿Olvidaste tu contraseña?, escribe su correo registrado y recibe un enlace. El enlace vence en 20 minutos, es de un solo uso y no contiene la contraseña. Al guardar una nueva contraseña se cierran las sesiones anteriores. Funciona para huésped, anfitrión y administrador activos.

## Preparar la base de datos existente

Mantén el proxy abierto en 5433. Desde la raíz del repositorio puedes actualizar migraciones y permisos sin editar tu .env:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\actualizar-bd.ps1
```

El asistente pide en privado la contraseña de nomada_owner y devuelve al terminar la configuración anterior del proceso. Coordina la operación con el equipo. Si prefieres hacerlo manualmente: Ejecuta `npm.cmd run migrate` con la conexión de `nomada_owner`, como en las migraciones anteriores. Las migraciones 3 y 4 agregan `password_resets` y `recovery_mail_jobs`; conserva los datos existentes. Coordina esta actualización con el equipo antes de aplicarla a la base compartida.

Después, desde Cloud SQL Studio como propietario, ejecuta en la base `nomada`:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON password_resets, recovery_mail_jobs TO nomada_app;
```

Devuelve `DATABASE_URL` al usuario de ejecución `nomada_app` antes de iniciar la aplicación.

## Configurar Gmail

1. Deben ser dueños de `nomada.reservaciones@gmail.com` o tener acceso autorizado a esa cuenta. Escribir el nombre no crea la cuenta ni permite enviar desde ella.
2. En esa cuenta de Google, activa la verificación en dos pasos y crea una contraseña de aplicación. Si Google no permite esa opción en la cuenta, usa un proveedor SMTP autorizado diferente.
3. En el archivo local `.env`, agrega estas variables; sustituye el marcador con la contraseña de aplicación, no con la contraseña normal. No compartas la contraseña en el chat ni la subas a Git.

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=nomada.reservaciones@gmail.com
SMTP_FROM=nomada.reservaciones@gmail.com
SMTP_PASSWORD=REEMPLAZAR_CON_CONTRASENA_DE_APLICACION
```

4. Confirma que `PUBLIC_ORIGIN` coincida con la dirección usada para abrir la aplicación, por ejemplo `http://127.0.0.1:3000`. El enlace usa esa dirección. Para abrirlo desde otro dispositivo necesitas alojar la aplicación en una dirección HTTPS accesible a ese dispositivo.
5. Reinicia únicamente el servidor con `npm.cmd start`; conserva el proxy abierto.
6. Prueba con una cuenta de usuario cuyo correo puedas consultar. Revisa también spam. No solicites otra recuperación durante dos minutos. Tras cambiar la contraseña, comprueba que la anterior dejó de funcionar y que reutilizar el enlace falla.

Sin SMTP configurado la página informa que la recuperación está pendiente. Un mensaje genérico después de solicitar recuperación no confirma entrega: revisa la bandeja del destinatario. Los errores de entrega se registran sin contraseñas ni enlaces en la terminal del servidor.

Las contraseñas y los tokens se guardan derivados mediante hash, y no se devuelven en respuestas ni se anotan en la bitácora. Hay un intervalo de dos minutos entre enlaces para la misma cuenta y un límite por dirección de conexión. La solicitud encola el correo y no espera al SMTP. La cola cifra el enlace mediante AES-256-GCM con una clave derivada del secreto SMTP, reintenta hasta cinco veces y elimina el contenido después de enviarlo o descartarlo. Si cambia SMTP_PASSWORD, los mensajes pendientes con el secreto anterior no se podrán descifrar: los usuarios deben solicitar un enlace nuevo.

En el servidor local el trabajador se inicia con `npm.cmd start`. En Cloud Run no se ejecuta en segundo plano dentro del servicio web: se requiere un trabajador dedicado con CPU disponible y conexión a la misma base, iniciado mediante `npm.cmd run mail:work` o un servicio de colas administrado equivalente. No publicar recuperación en Cloud Run sin ese trabajador. La ejecución actual con proxy mantiene el procesamiento local.

Los trabajos completados se conservan siete días sin el contenido del correo; el trabajador limpia después esos registros. Una interrupción justo después de que SMTP acepte el mensaje y antes de confirmar la entrega en la base puede provocar reenvío del mismo enlace; el token sigue siendo de un solo uso.

Referencia de configuración de Gmail: https://support.google.com/accounts/answer/185833
