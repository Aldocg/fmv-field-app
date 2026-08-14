# FMV Field App — Safe UX audit implementation

This revision applies the visual/UX audit without changing the existing Supabase schema, RPC signatures, authentication flow, operational status values, or Extra Services persistence model.

## Implemented

### Today
- Summary metrics became touch filters: All / Pending / Completed / Issues.
- Added a read-only **Next Up** section based on the first pending item in the current plan order.
- Grouped records by Issues, Pending, and Completed.
- Completed group is collapsed by default in the All view.
- Removed repeated scheduled date from Today cards.
- Reduced service-card height and visual padding.

### Schedule
- Added All / Overdue / Upcoming / Completed planning filters.
- Overdue is derived visually from existing data only: `pending` + `scheduled_date < today`.
- Added Overdue / This Week / Upcoming / Completed visual groups.
- Overdue cards are highlighted and show the number of overdue days.
- Kept Wednesday / Thursday / Friday filters and all existing visit edit behavior.

### Clients
- Cards now show Client → Address → Service(s) → Regular Day(s) → Next Service.
- Added All / Wed / Thu / Fri quick filters.
- Next Service is calculated from existing open-plan items.
- No new API/database requirement was introduced.

### Extra Services
- Primary CTA now includes text where space permits: `Add Extra`.
- Empty state includes `Add Extra Service` action.
- Extra cards prioritize Client → Extra Work → Date → Notes / Total.
- Client name is fetched from the existing `clientes` table when permitted; otherwise it gracefully falls back to `Client #ID`.

### Navigation
- `Extras` label changed to `Extra Services` with responsive compact typography.

## Intentionally NOT implemented

The audit proposed possible future statuses/actions such as `In Progress`, `Start Service`, `Issue`, `Skipped`, etc. These were intentionally not added because the existing database/RPC currently supports only:

- pending
- completed
- not_completed
- rescheduled
- canceled

Adding unsupported statuses would risk breaking the working production flow.

## Validation

TypeScript compilation (`tsc -b`) completed successfully.
A full Vite bundle could not be executed in the Linux validation container because the uploaded ZIP contained Windows-installed `node_modules` and therefore lacked Rollup's Linux optional native package. On the user's Windows development machine, run:

```bash
npm install
npm run build
```

No database migration is required for these audit changes.
