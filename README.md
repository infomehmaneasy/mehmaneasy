# Mehmaan Easy

**Stay Better. Book Easier.**

Mehmaan Easy is an India-focused curated-stays marketplace. The current app includes guest discovery, host listing submission, verified listing moderation, and pre-booking questions for Mehmaan Easy support.

## Backend

- **Supabase Auth** handles email/password registration, email confirmation, Google sign-in, and sessions.
- **Supabase Postgres** stores profiles, listings, private property details, and support enquiries.
- **Supabase Storage** stores listing photos in the public `property-images` bucket. Uploads are restricted to a verified host's own folder.
- **Cloudinary is not required** for the current listing-photo workflow; it can be added later if image transformations/CDN features are needed.

The application uses the public Supabase publishable key together with Postgres Row Level Security. It does not use a Supabase service-role/secret key in the browser or server application. Do not add a privileged key to `NEXT_PUBLIC_*` variables or commit it.

## Supabase setup

1. In the Supabase dashboard, open **SQL Editor**, paste and run [`supabase/migrations/202610190001_marketplace.sql`](./supabase/migrations/202610190001_marketplace.sql).
2. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and add the local and deployed app URLs to the redirect allowlist. Email verification returns guests to `/dashboard`; Google OAuth returns to `/auth/callback`.
3. In **Authentication → Providers**, enable Email and Google. For Google, create/configure the OAuth client with the callback URL shown in Supabase's Google provider setup.
4. Copy `.env.local.example` to `.env.local` if you do not already have one. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPPORT_EMAIL`
   - `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` if support-question email notifications are desired
   - `NEXT_PUBLIC_APP_URL`
5. The migration creates the tables, RLS policies, role/verification functions, and the Storage bucket/policies. It contains no service-role key.
6. Create your first account through the website and verify its email. In **SQL Editor**, assign administrator access to your own verified account:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'your-verified-admin-email@example.com';
   ```

   Admin access is controlled by this protected profile role; users cannot grant themselves admin access.

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

## Host and moderation workflow

1. Register as a host using email confirmation or Google sign-in.
2. Submit a stay with at least three photos.
3. An administrator signs in and opens `/admin` to approve or reject the listing with review notes.
4. Only approved and active stays are shown in public discovery.

Public property data does not contain the full address, postal code, host email, or exact coordinates. Those fields live in `property_private` and are available only to the owner and admins. Editing listing details sends the stay back for review.

## Current limits and migration notes

- Booking creation, calendar availability/conflict prevention, payment processing (including the requested 70/30 split), invoices, refunds, payouts, external calendar sync, post-booking messaging, reviews, and notification integrations are not implemented yet. The site must not be treated as accepting reservations or payments.
- Legacy Firebase/MongoDB accounts and property data have **not** been migrated. Existing users must create/confirm a Supabase account. Existing property data needs a deliberate export/import after its source database is reachable; do not assume the old MongoDB listings are present in Supabase.
- Email delivery depends on valid Gmail SMTP settings. Supabase sends authentication verification mail using the project's configured Auth email provider.
- The `functions/` directory and Firebase project files are legacy; the Next.js web app no longer uses Firebase for sign-in, listing data, or image uploads.

## Key safety

A privileged Supabase key was shared in chat during setup. Rotate/revoke it in the Supabase dashboard before using it elsewhere. The web application only needs the Supabase project URL and publishable key; the privileged key is intentionally not part of this configuration.
