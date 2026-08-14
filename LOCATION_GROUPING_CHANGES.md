# Location Grouping Update

This version keeps all existing Supabase/Auth/RPC behavior intact.

## Navigation changes

Today, Schedule, Clients, and Extra Services now use:

CITY
  -> STREET
     -> COMPACT ROW
        -> FULL DETAIL

All city and street groups start COLLAPSED.

When the user searches, matching city/street groups expand automatically so the
result is visible without extra taps.

## Address normalization

Grouping is visual only; the database is not modified.

The UI:
- removes the leading house number;
- normalizes common suffixes such as Drive/Dr, Street/St, Road/Rd,
  Avenue/Ave, Lane/Ln, Court/Ct, Boulevard/Blvd, etc.;
- removes punctuation and duplicate spaces;
- keeps the original address unchanged for display and database storage.

Example:
- 47 Jernee Drive
- 49 JERNEE DR.
- 51 Jernee Dr

are grouped together under "Jernee Dr".

## Safety

No changes were made to:
- Supabase schema
- RLS
- authentication
- save_monthly_service_result
- save_extra_service
- status business rules
