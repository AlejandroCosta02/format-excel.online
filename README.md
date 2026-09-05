# ExcelFlow

SaaS de productividad (Formateador Excel, Mail Merge y Extractor de Manifest) en Next.js App Router.

## Arranque local

1. Copia `.env.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NOWPAYMENTS_API_KEY` y `NOWPAYMENTS_IPN_SECRET`
   - `RESEND_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`
2. En [Supabase Auth](https://supabase.com/dashboard) habilita el proveedor **Google**.
3. Redirect URL de OAuth: `http://localhost:3000/auth/callback`.
4. En el SQL Editor de Supabase, vuelve a ejecutar `supabase/schema.sql` (perfiles en `free`, RLS de plantillas Pro, Realtime).
5. En NOWPayments, IPN: `https://TU_DOMINIO/api/webhooks/nowpayments`.
6. `npm install` && `npm run dev`

## MVP (guest-first)

- **Formateador:** exportar gratis. Guardar plantilla y lotes = Pro (pago). Iniciar sesión no activa Pro.
- **Mail Merge:** 5 envíos/día invitado, 10/día con cuenta `free`, ilimitado en `pro`.
- **Extractor Manifest:** 1 archivo ≤ 2 MB en gratis; lotes o archivos grandes = Pro.

Los HTML originales en `./scripts/` se conservan como referencia.
