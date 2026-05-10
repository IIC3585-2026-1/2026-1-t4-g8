# BanGOD

Una PWA para tomar notas en Markdown, inspirada en [Bangle.io](https://bangle.io?utm_source=chatgpt.com). Construida con JavaScript vanilla — sin frameworks.

## Características

- **Offline-first**: Todas las notas se almacenan en IndexedDB y permanecen accesibles sin conexión a internet.
- **Notificaciones push**: Recordatorios enviados mediante Firebase Cloud Messaging, incluso cuando la aplicación está cerrada.
- **Instalable**: Se puede agregar a la pantalla de inicio y ejecutar en modo standalone (sin interfaz del navegador).
- **Editor Markdown**: Escribe notas en Markdown con opción de vista previa en tiempo real.
- **Recordatorios**: Programa una notificación push para cualquier nota.
- **Búsqueda de texto completo**: Busca en títulos, descripciones y contenido de las notas.

## Running Locally

Los service workers requieren un origen HTTP real (`file://` no funciona).

**Opción 1 — Firebase CLI (recomendada):**
```bash
npm install -g firebase-tools
firebase login
firebase emulators:start --only hosting
# Open http://localhost:5000
```

**Opción 2 — Python:**
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

**Opción 3 — Node:**
```bash
npx serve .
```

Abre Chrome DevTools → pestaña Application para verificar:
* Service Workers: registrados y activos
* IndexedDB → bangle-notes → notes: persistencia de notas
* Manifest: instalabilidad e íconos


## Environment Variables

El servidor de notificaciones push (server/) requiere:

| Variable | Description |
|---|---|
| `SERVICE_ACCOUNT` | JSON de la cuenta de servicio de Firebase (como string) |
| `PORT` | Puerto del servidor (por defecto: 3000)) |

El archivo `server/serviceAccount.json` está excluido del control de versiones (.gitignore). Para ejecutar el servidor localmente:

```bash
cd server
npm install
SERVICE_ACCOUNT='{"type":"service_account",...}' npm start
```

## Arquitectura de la PWA

### Soporte Offline

La aplicación utiliza una estrategia cache-first:

1. Durante install, el service worker precachea todos los assets estáticos (HTML, CSS, JS, íconos).
2. En cada fetch, el service worker devuelve la respuesta cacheada si existe; de lo contrario obtiene el recurso desde la red.
3. Todas las notas se leen y escriben en IndexedDB — no se requiere conexión de red para operar con notas.

### Notificaciones Push

Flujo de notificaciones push:

1. El usuario concede permisos → el navegador genera un token FCM único.
2. El token se guarda en Firestore (tokens/current) y en localStorage.
3. El usuario crea un recordatorio → la app guarda { token, title, notifyAt } en Firestore (reminders/{noteId}).
4. El servidor Express en Render.com lee el token desde Firestore y envía una notificación push mediante FCM Admin SDK.
5. firebase-messaging-sw.js recibe la notificación en segundo plano y muestra la notificación.

Firebase Messaging requiere un service worker dedicado exactamente en la ruta `/firebase-messaging-sw.js`. Este es independiente del service worker encargado del caché de la aplicación.

### Instalabilidad

La aplicación se vuelve instalable cuando:
* Existe un manifest.webmanifest válido (nombre, íconos, start_url, display: standalone)
* Hay un service worker registrado
* La página se sirve mediante HTTPS (o localhost)

## Despliegue

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**Cloud Functions:**
```bash
cd functions
npm install
firebase deploy --only functions
```

**Servidor Push (Render.com):**
Configura la variable de entorno `SERVICE_ACCOUNT` en el panel de Render y luego despliega desde el directorio `server/`.


## Uso de IA

* **App:** html, estilos y funcionamiento general de la página hecho con ayuda de IA.
* **Notificaciones Push:** Asistencia en la implementación del sistema de notificaciones y la lógica por detrás (integración con FCM, service worker y flujo de permisos/token).
* **Planificación:** Apoyo en la organización y distribución de tareas del equipo al inicio y durante el desarrollo.
* **Generación de documentación:** este README y otros documentos que usamos internamente como equipo generados con apoyo IA.

## Autoevaluación

### Fortalezas
- Buen planning y separación de responsabilidades.
- Uso efectivo de IA como herramienta de apoyo en el desarrollo.
- Entrega funcional dentro del alcance definido.

### Por mejorar
- Distribuir mejor los tiempos (empezar antes dentro de lo posible).