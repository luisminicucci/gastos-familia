# Gastos Personales

Web gratuita para controlar los gastos de la familia. Funciona en la notebook y se instala en Android y iPhone como una app (PWA).

## Qué hace

- Cada integrante con su usuario, todos en un mismo grupo familiar (se suman con un código de invitación).
- Cargar gastos con categoría, quién pagó, medio de pago, cuotas de tarjeta, fecha y nota.
- Las compras en cuotas cuentan solo la cuota de cada mes.
- Presupuesto mensual por categoría con avisos al llegar al 85%.
- Gastos fijos: se marcan una vez y cada mes aparecen para cargarlos con un toque.
- Resumen por mes, por categoría y por persona. Exportar a Excel (CSV).
- Cambios en vivo: si alguien carga un gasto, los demás lo ven al instante.

## Puesta en marcha

1. **Supabase:** crear un proyecto gratis, abrir *SQL Editor*, pegar el contenido de [`supabase/schema.sql`](supabase/schema.sql) y tocar *Run*.
2. En *Authentication › Sign In / Providers › Email*, desactivar **Confirm email** (opcional, para no tener que confirmar por correo).
3. En *Authentication › URL Configuration*, poner como *Site URL* la dirección de GitHub Pages.
4. Completar la *Project URL* y la clave *anon public* en [`src/config.js`](src/config.js).
5. **GitHub Pages:** en *Settings › Pages*, elegir *Source: GitHub Actions*. Cada cambio en `main` se publica solo.

## Desarrollo

```bash
npm install
npm run dev
```

Hecho con React + Vite + Supabase.
