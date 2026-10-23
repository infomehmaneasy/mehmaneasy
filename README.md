# Mehmaan Easy

**Stay Better. Book Easier.**

Mehmaan Easy is an India-focused curated-stays marketplace. The current app includes guest discovery, host listing submission, verified listing moderation, host-managed booking requests, an admin-managed experiences catalogue, and real-time support chat.

Guest discovery includes a persistent light/dark appearance preference, an interactive listings map with host-controlled exact pins and city-area fallbacks, and the interactive Décor Studio moodboards.

## Backend

- **Supabase Auth** handles email/password registration, Google sign-in, and sessions. Email confirmation is disabled for the intended low-friction test flow; Google sign-in remains provider-verified.
- **Supabase Postgres** stores profiles, listings, private property details, and support enquiries.
- **Supabase Storage** stores listing photos in the public `property-images` bucket. Uploads are restricted to a verified host's own folder.
- **Cloudinary is not required** for the current listing-photo workflow; it can be added later if image transformations/CDN features are needed.

The application uses the public Supabase publishable key together with Postgres Row Level Security. It does not use a Supabase service-role/secret key in the browser or server application. Do not add a privileged key to `NEXT_PUBLIC_*` variables or commit it.

## Supabase setup

1. In the Supabase dashboard, open **SQL Editor** and run the migrations in order:
   - [`supabase/migrations/202610190001_marketplace.sql`](./supabase/migrations/202610190001_marketplace.sql) creates the marketplace schema.
   - [`supabase/migrations/202610190002_booking_requests.sql`](./supabase/migrations/202610190002_booking_requests.sql) enables payment-free booking requests and their role policies.
   - [`supabase/migrations/202610190003_booking_contact_privacy.sql`](./supabase/migrations/202610190003_booking_contact_privacy.sql) restricts participant contact details until a booking is confirmed.
   - [`supabase/migrations/202610190004_admin_email_allowlist.sql`](./supabase/migrations/202610190004_admin_email_allowlist.sql) grants admin access only to the verified `info.mehmaneasy@gmail.com` account.
   - [`supabase/migrations/202610190005_email_auth_and_host_access.sql`](./supabase/migrations/202610190005_email_auth_and_host_access.sql) allows authenticated accounts to host and book without email confirmation, while preserving Google-only admin promotion.
   - [`supabase/migrations/202610230001_public_property_map_pins.sql`](./supabase/migrations/202610230001_public_property_map_pins.sql) adds opt-in public map pins while keeping exact locations private by default.
   - [`supabase/migrations/202610240001_host_licenses_experiences_booking_authority.sql`](./supabase/migrations/202610240001_host_licenses_experiences_booking_authority.sql) adds private tourism-license IDs, admin-managed experiences, and host/guest-only booking actions.
2. In **Authentication → URL Configuration**, set the Site URL to `https://mehmaneasy-three.vercel.app` and add `http://localhost:3000/**` and `https://mehmaneasy-three.vercel.app/**` to the redirect allowlist. Google OAuth returns to `/auth/callback`.
3. In **Authentication → Sign In / Providers**, keep Email enabled and turn **Confirm email** off for this test phase. This lets email/password sign-up create a usable session immediately; it does not prove mailbox ownership. Configure Google with a Google Cloud **Web application** OAuth client. Add Supabase's Google callback URL as an authorized redirect URI in Google Cloud, then put the client ID and client secret into Supabase's Google provider settings. Never add the client secret to `.env.local`, frontend code, or a `NEXT_PUBLIC_*` variable. The current Google consent screen is in **Testing**; only listed test users can use Google sign-in until the app is published and any required verification is completed.
4. Copy `.env.local.example` to `.env.local` if you do not already have one. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPPORT_EMAIL` (optional; defaults to `info.mehmaneasy@gmail.com` for the support queue)
   - `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` if support-question email notifications are desired
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_TAWK_PROPERTY_ID` and `NEXT_PUBLIC_TAWK_WIDGET_ID` (optional; default to the supplied Tawk.to widget)
5. The migrations create the tables, RLS policies, role/verification functions, and the Storage bucket/policies. They contain no service-role key.
6. Sign in to the admin account using Google. The exact `info.mehmaneasy@gmail.com` account receives `admin` only when Supabase confirms its Google identity; password-only sign-up cannot claim the admin role.
7. SMTP is not needed for email/password sign-up while **Confirm email** is off. The project's `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` variables are for app-side support email and do not configure Supabase Auth's SMTP sender.

Guest questions are saved to Supabase and appear in the admin support queue even when email notifications are not configured. Configure `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` to send support email notifications.
The Tawk.to widget delivers live chats to the account's Tawk.to inbox; add the admin/team as agents in Tawk.to to receive and reply to those chats. This widget identifier is public embed configuration, not an API secret.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

## Host, moderation, and payment-free booking workflow

1. Register as a host using email/password or Google sign-in, then sign in.
2. Submit a stay with at least three photos.
3. An administrator signs in and opens `/admin` to approve or reject the listing with review notes.
4. Only approved and active stays are shown in public discovery.
5. A verified guest requests a future stay on a nightly-priced listing. This creates a request; it does not block availability or charge the guest.
6. The host reviews requests in `/dashboard` and can confirm or decline. Confirmation checks for overlapping confirmed stays atomically. The admin booking view in `/admin` is read-only; changes are allowed only for the actual guest or host on that booking.
7. Confirmed booking details, including the private address and participant contact information, become visible only to the guest, host, and admins. Guests can cancel before check-in; hosts/admins can mark a past stay complete.
8. The booking record displays the intended 70/30 split as a planning estimate, but payment status remains `not_collected`. Taxes and platform fees are not included. Money is arranged directly by the parties; the platform does not process payments.

Public property data does not contain the full address, postal code, host email, or exact coordinates. Those fields live in `property_private` and are available only to the owner and admins. Editing listing details sends the stay back for review.
Hosts can optionally store a tourism license ID, visible only to the listing owner and admins. Admins assign the Easy, Royal, or Gold collection when approving a property. Admins can publish experience listings at `/admin`; published experiences are available at `/experiences` and their detail pages.

## Current limits and migration notes

- Gateway checkout, tax/platform-fee calculation, invoices, refunds, payouts, external calendar sync, reviews, and automated booking emails/SMS/WhatsApp are not implemented. Booking requests and manual host confirmations are available for client testing, but they are not paid reservations and the site must not be treated as collecting money.
- Google sign-in is restricted to the OAuth consent screen's listed test users while its publishing status is **Testing**. Add each tester's email there or complete Google's app/domain verification before opening Google sign-in to all users.
- Legacy Firebase/MongoDB accounts and property data have **not** been migrated. Existing users must create/confirm a Supabase account. Existing property data needs a deliberate export/import after its source database is reachable; do not assume the old MongoDB listings are present in Supabase.
- Disabling email confirmation makes account creation simpler for testing but does not verify mailbox ownership. Re-enable it before production if email ownership is a trust requirement, and use a transactional email provider with a domain you control.
- The `functions/` directory and Firebase project files are legacy; the Next.js web app no longer uses Firebase for sign-in, listing data, or image uploads.

## Key safety

A privileged Supabase key was shared in chat during setup. Rotate/revoke it in the Supabase dashboard before using it elsewhere. The web application only needs the Supabase project URL and publishable key; the privileged key is intentionally not part of this configuration.
