# FMV Field App

Mobile-first React application based on the approved service-planning prompt.

## Core included
- React + TypeScript + Vite + Tailwind
- Supabase Auth with existing `profiles`
- Open monthly plans only
- Today / Schedule / Clients / Extras / Account
- Wednesday, Thursday, Friday mobile navigation
- Search by client/address/city
- Visit status editing with current business rules
- Existing `save_monthly_service_result` RPC integration
- History timeline
- GitHub Pages Actions deployment using HashRouter
- Extra Services isolated but intentionally not persisted until the table is defined

## Configure
Copy `.env.example` to `.env` and set your Supabase Project URL and Publishable Key.

```bash
npm install
npm run dev
```

## GitHub Pages
Repository Settings → Secrets and variables → Actions:
- secret `VITE_SUPABASE_URL`
- secret `VITE_SUPABASE_PUBLISHABLE_KEY`
- variable `VITE_PASSWORD_RECOVERY_URL` = `https://aldocg.github.io/Recovery/`

Then Settings → Pages → Source = GitHub Actions.

## Important RPC note
The database function `save_monthly_service_result` exists in the current architecture, but its exact parameter names were not included in the supplied prompt. `src/services/planService.ts` tries two common signatures. Once the exact PostgreSQL signature is confirmed, reduce it to the exact one.

## Extra Services
No migration is included because the prompt explicitly says the schema is not final. The UI/service boundary is isolated under `src/features/extras/`.


Note: GitHub Actions uses `npm install` so a package-lock file is not required in the starter ZIP.


## Adjusted to your real Supabase schema

This ZIP includes `DATABASE_CURRENT_STATE.md`.

The integration now uses the exact RPC signature exported from your Supabase project:

```ts
supabase.rpc('save_monthly_service_result', {
  p_id_item,
  p_operational_status,
  p_actual_service_date,
  p_observations
})
```

No `source` parameter is sent because the current RPC does not accept one.

The current function requires an Actual Service Date for every non-pending result,
including Rescheduled and Canceled. The mobile validation now matches that database rule.

The `Clients` screen intentionally derives its records from open-plan snapshots because
your exported RLS policies do not currently include a SELECT policy for `public.clientes`.
See `sql/OPTIONAL_clients_select_policy.sql` if you later want the full active-client directory.


## Extra Services module

Run:

```sql
sql/CREATE_extra_services_module.sql
```

This creates:

- `public.monthly_service_item_extras`
- RLS policies
- authenticated SELECT policy for `public.servicios`
- authenticated SELECT policy for `public.clientes`
- `public.save_extra_service(...)`

Extra Services are intentionally independent from the monthly-plan result.

An Extra Service can:

- optionally be related to a monthly visit (`id_item`);
- always belong to a client;
- use an existing service from `public.servicios`; or
- use a manually typed service name if the service does not yet exist in the catalog.

The table stores `service_name` as a snapshot even for catalog services, so future changes
to the service catalog do not alter historical Extra Service records.

This React version now includes a dedicated Extra Services module with list/search and
a mobile-friendly create form.
