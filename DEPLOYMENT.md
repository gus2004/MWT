# Levantamiento de MWT en tres instancias

## Arquitectura recomendada

```text
Navegador -> Vercel (Next.js)
                 /api y /uploads -> Render (Express + Prisma)
                                      -> PostgreSQL administrado
```

La opción más sencilla es usar PostgreSQL de Render junto con el backend de
Render. Ambos quedan en la misma región y el backend puede usar la URL interna
de la base de datos. El archivo [`render.yaml`](./render.yaml) deja declarados
el servicio, la base y las migraciones.

## 0. Preparación local

1. No subas ningún `.env`, contraseña, JWT secret ni archivo de credenciales.
2. Crea la base local si vas a probar antes:

   ```powershell
   docker compose up -d postgres
   ```

3. En `backend/.env`, configura `DATABASE_URL`, `JWT_SECRET`,
   `FRONTEND_URL=http://localhost:3000` y `PORT=3001`.
4. Aplica el esquema y prueba el backend:

   ```powershell
   cd backend
   npx prisma migrate deploy
   npm run build
   npm start
   ```

5. En `frontend/.env.local`, usa:

   ```text
   BACKEND_ORIGIN=http://localhost:3001
   NEXT_PUBLIC_API_URL=
   ```

## 1. Instancia de base de datos (Render Postgres)

### Con Blueprint

1. Sube el repositorio a GitHub sin archivos `.env`.
2. En Render selecciona **New > Blueprint** y elige el repositorio.
3. Render detectará [`render.yaml`](./render.yaml). Confirma la región y crea
   `mwt-postgres` y `mwt-backend`.
4. En el formulario de variables secretas del backend define:
   - `JWT_SECRET`: una cadena aleatoria larga.
   - `FRONTEND_URL`: la URL final de Vercel, por ejemplo
     `https://mwt.vercel.app`.
5. El `DATABASE_URL` se enlaza automáticamente a la base creada.

### Sin Blueprint

1. Crea **New > Postgres** en Render.
2. Usa la misma región que el backend y conserva la URL interna para el
   servicio Render.
3. Crea **New > Web Service**, raíz `backend`, runtime Node.
4. Configura:
   - Build: `npm ci && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm start`
   - Health check: `/`
5. Copia la **Internal Database URL** como `DATABASE_URL` del backend.

Las migraciones versionadas de `backend/prisma/migrations` se ejecutan durante
el arranque. No uses `prisma db push` en producción.

## 2. Instancia Backend (Render Web Service)

Variables mínimas:

```text
NODE_ENV=production
DATABASE_URL=<Internal Database URL de Render>
JWT_SECRET=<secreto aleatorio>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<proyecto>.vercel.app
```

Después del primer despliegue, comprueba:

```text
https://<backend>.onrender.com/
```

Debe responder JSON con `ok: true`.

### Archivos subidos

El backend sirve `uploads/evidencias` y `uploads/reglamento` desde el disco
local. El disco efímero de un servicio web no es una solución permanente:
los archivos pueden perderse al redeployar o reiniciar. Para producción usa
S3, Cloudinary, Cloudflare R2 o Supabase Storage y guarda en la base solo la
URL. Para una demostración controlada, un Render Persistent Disk también
funciona, pero queda ligado a una instancia y normalmente requiere un plan
pagado.

## 3. Instancia Frontend (Vercel)

1. Importa el mismo repositorio en Vercel.
2. Define **Root Directory** como `frontend`.
3. Vercel detectará Next.js:
   - Build: `npm run build`
   - Install: `npm ci`
4. En variables de entorno de **Production** define:

   ```text
   BACKEND_ORIGIN=https://<backend>.onrender.com
   NEXT_PUBLIC_API_URL=
   ```

5. Despliega y copia la URL de Vercel.
6. Regresa a Render y actualiza `FRONTEND_URL` con esa URL. Reinicia el
   backend para aplicar CORS.

El frontend ya usa `next.config.ts` para reenviar `/api/*` y `/uploads/*` al
backend, por lo que el navegador no necesita conocer directamente la URL de
la base de datos.

## Prueba final

1. Abre la URL de Vercel.
2. Inicia sesión y verifica una consulta autenticada.
3. Crea o consulta un evento y una inscripción.
4. Sube una evidencia o reglamento y verifica que se pueda abrir desde la
   interfaz.
5. En Render revisa los logs y confirma que `prisma migrate deploy` terminó
   sin errores.
6. Prueba el backend desde una página distinta: una petición con un `Origin`
   que no esté en `FRONTEND_URL` debe ser rechazada por CORS.

## ¿Hay pgAdmin online?

Sí, pero conviene distinguir dos cosas:

- **pgAdmin 4 local**: es la opción más completa. Se conecta usando la
  **External Database URL** de Render (host, puerto, usuario, base y
  contraseña). No expongas `DATABASE_URL` en el frontend.
- **pgAdmin web autoalojado**: se puede ejecutar en Docker o en otro servicio,
  pero requiere protegerlo con autenticación y mantenerlo actualizado. No lo
  pondría público sin VPN, allowlist de IP o SSO.
- **Consola web del proveedor**: Supabase ofrece SQL Editor y Neon ofrece
  consola SQL; son alternativas prácticas si se elige uno de esos proveedores
  en lugar de Render.

Para este prototipo recomiendo **Render Postgres + pgAdmin 4 local**. Si la
prioridad es administrar todo desde el navegador, recomiendo **Supabase
Postgres + Supabase Dashboard**, manteniendo el backend en Render y usando la
cadena de conexión compatible con Prisma. La base no debe estar conectada
directamente al frontend.

## Alternativa de proveedor

Si Render Postgres no está disponible en el plan o región deseada:

1. Crea la base en Supabase o Neon.
2. Copia su cadena PostgreSQL a `DATABASE_URL` en Render.
3. Ejecuta las migraciones desde el backend con `npx prisma migrate deploy`.
4. Usa el SQL Editor del proveedor o pgAdmin local para administrar la base.

Mantén la base y el backend en regiones cercanas y usa la cadena con pooling
solo si el proveedor lo recomienda para el patrón de conexiones del servicio.
