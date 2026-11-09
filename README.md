# Anantapur Football Club — consolidated project base

React + Vite + Supabase. This package consolidates the latest source version found in the uploaded AFC project archive (`AFC-Project-Clean 7`). It excludes `.env`, Git history, `node_modules`, and build output.

## Setup

1. Install Node.js LTS.
2. Open this folder in Terminal.
3. Run `npm install`.
4. Copy `.env.example` to `.env` in the same folder as `package.json`.
5. Add the Supabase project URL and publishable/anon key to `.env`.
6. Run `npm run dev`.
7. Run `npm run build` before deployment.

Never put a Supabase `service_role` or secret key in a `VITE_` variable or browser code. Do not commit `.env`.

## Routes and implemented source features

- `/` — cinematic AFC public website and player-interest registration form.
- `/admin` — Supabase Auth staff login and role-based dashboard.
- Admin/staff — registration list and registration QR display.
- Admin — Player Management tab, using `afc_admin_list_players` and `afc_admin_assign_player_code` RPCs.
- Admin/staff/checkin_staff — QR camera scanner; QR payloads use `AFCREG:<registration UUID>` and the scanner calls `afc_check_in`.
- QR scan feedback remains visible for at least two seconds.

## Supabase requirements

The frontend expects these existing database RPCs:

- `afc_register_interest(p_full_name, p_phone, p_age, p_emergency_contact)`
- `afc_check_in(p_registration_id)`
- `afc_admin_list_players()`
- `afc_admin_assign_player_code(p_player_id, p_player_code)`

Apply `supabase/player-management.sql` if the two Player Management RPCs and unique Player ID index are not already installed. The registration and check-in RPCs are expected to exist in the Supabase project already; their complete migration SQL is not included in this archive.

The public registration flow currently calls a single event through the database RPC; it is not a multi-event event-management interface. The form's optional playing-position field is displayed but is not passed to the current registration RPC, so it is not persisted by this source version.

## Not implemented in this package

- Admin event creation/editing and publishing.
- Payment gateway and payment reconciliation.
- Admin gallery uploads or CMS editing.
- Export/reporting workflows.
- Separate event-manager and gallery-manager workspaces; those roles are recognized but their management screens are placeholders.

Do not advertise these as live features until separately implemented and tested.

## Vercel deployment

- Framework preset: Vite
- Root directory: `./`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables for Preview and Production as appropriate.

Test Preview thoroughly before merging or deploying to Production. Camera access requires HTTPS or localhost.
