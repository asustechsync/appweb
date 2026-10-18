# Comandos importantes

- Generar Prisma: `npm run db:generar`
- Aplicar las migraciones a PostgreSQL: `npm run db:migrar`
- Cargar los productos iniciales: `npm run db:semilla`

Antes de migrar o cargar productos, configura `DATABASE_URL` y `DIRECT_URL`
en `.env.local` usando `.env.example` como guia. `db:generar` solo crea el
cliente de Prisma; no crea las tablas ni inicia PostgreSQL.

## Calidad

- Correr las pruebas: `npm run prueba` (viven junto al codigo: `totales.test.ts`)
- Revisar estilo y errores: `npm run revisar`
- Corregir lo que se pueda solo: `npm run arreglar`

Antes de cada commit: `npm run revisar`, `npm run typecheck` y `npm run prueba`.

