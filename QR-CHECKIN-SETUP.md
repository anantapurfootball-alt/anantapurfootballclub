# AFC QR check-in module

This update adds registration QR display and a camera scanner to the existing Admin dashboard.

## Dependencies

Run in the project folder:

```bash
npm install html5-qrcode qrcode.react
```

## Existing database requirement

The project calls the already-installed Supabase RPC:

```sql
public.afc_check_in(p_registration_id uuid)
```

It must be configured to allow only authenticated AFC admin/staff/checkin_staff users and to insert one check-in per registration. The scanner sends the registration UUID encoded as `AFCREG:<uuid>`.

## Use

- Sign in at `/admin`.
- Admin/staff: open Registrations and choose SHOW QR beside a registration.
- Admin/staff/checkin_staff: open QR CHECK-IN and allow camera access.
- Camera access works on `localhost` or an HTTPS deployment.

Do not deploy until tested with a real staff account and a test registration. The scanner reports the RPC response; it does not bypass database permissions.
