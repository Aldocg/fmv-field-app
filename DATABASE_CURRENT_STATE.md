# Current Supabase state used by this project

This version was adjusted from the exported SQL results supplied on 2026-08-13.

## Exact save RPC

```sql
save_monthly_service_result(
  p_id_item bigint,
  p_operational_status text,
  p_actual_service_date date,
  p_observations text
)
```

Returns:

```text
monthly_service_items
```

The React app now calls this exact signature. No guessed `source` parameter is sent.

## Important RPC rules

The current database function:

- requires an authenticated active user;
- accepts only:
  - `completed`
  - `not_completed`
  - `rescheduled`
  - `canceled`
- does NOT accept `pending` as a saved result;
- requires `p_actual_service_date` for every saved result;
- rejects future actual service dates;
- requires observations for:
  - `not_completed`
  - `rescheduled`
  - `canceled`;
- only allows edits while the plan is `open`;
- blocks approved services;
- blocks services already `ready` or `invoiced`;
- normally only allows the original registered user to edit an already registered visit;
- rejected visits can be corrected by their original user or an admin.

The mobile UI follows these rules instead of weakening them.

## Current RLS

Existing SELECT policies were found for:

- `profiles`
- `monthly_service_plans`
- `monthly_service_items`
- `monthly_service_item_history`

`clientes` and `servicios` have RLS enabled but no policy was present in the supplied policy export.

For that reason, the mobile `Clients` page currently builds its client directory from
snapshot fields in `monthly_service_items` belonging to OPEN plans. This makes the app
usable with the current RLS without adding broad access to `clientes`.

## History RLS

Current history policy allows:

- admins to read history;
- workers to read history for an item where `registered_by = auth.uid()`.

The app treats history as optional so a history permission issue never blocks service editing.

## Extras

No Extras table was supplied. No migration is created automatically. The Extras UI remains prepared but disabled for writes.
