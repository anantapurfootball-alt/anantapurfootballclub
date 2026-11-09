# AFC Player Management setup

## 1. Apply the database migration

Open Supabase Dashboard → SQL Editor → New query. Open `supabase/player-management.sql`, copy the complete contents, run it, and confirm Success.

This migration creates two `SECURITY DEFINER` RPC functions. Both check that the signed-in user has `profiles.role = 'admin'`. It does not add public access to the `players` table.

## 2. Configure the local app

Create a `.env` file beside `package.json` (never commit or upload it):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

## 3. Install and run

```bash
npm install
npm run dev
```

Open `/admin`, sign in as an account whose `profiles.role` is `admin`, then choose **PLAYER MANAGEMENT**.

## 4. Player ID rules

The suggested ID is first three letters of the first name + last two mobile digits + first two mobile digits. Example: ANANTH and 9876543210 → ANA1098. The admin can edit the suggestion. The database unique index rejects duplicates; if an ID is taken, the UI suggests suffix alternatives. The underlying UUID remains the actual database identifier.

## Notes and limitations

- This module only assigns IDs to player records that already exist in `public.players`.
- It does not automatically merge historical registrations into player records.
- It does not change event registration generation, check-in, payment, or gallery functionality.
- The `players` table remains protected by RLS; the UI accesses it through admin-checked RPC functions.
- Test on the local development server before any deployment. Do not put a service-role key in `.env` or frontend code.
