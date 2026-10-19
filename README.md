# Mehmaan Easy

**Stay Better. Book Easier.**

Mehmaan Easy is an India-focused, curated accommodation marketplace. This repository currently contains the guest discovery experience, host listing submission and verification flow, account registration, and an admin queue for listing reviews and guest questions.

## Current scope

Implemented:

- Responsive stay discovery homepage, animated navigation, destination search, listing filters, and saved stays in the current browser.
- Guest and host accounts using Firebase Authentication.
- Host listings with property type, Royal/Gold/Easy collection, nightly or monthly pricing, guest capacity, amenities, pet-friendly flag, and photos.
- New and edited listings enter the verification queue. Only approved and active listings are public.
- Public listing responses omit host contact details, the full street address, postal code, and exact coordinates.
- Pre-booking guest questions are stored for the Mehmaan Easy support team; they are never emailed directly to the host.
- An admin workspace for approving/rejecting listings and reviewing support questions.

Not yet implemented:

- Booking creation, date-calendar availability/holds, conflict prevention, invoices, or cancellation/refund workflows.
- Payment processing, including the 70% online / 30% at check-in split. **Do not collect or represent payments as enabled.**
- SMS, WhatsApp, push notifications, external-calendar sync, reviews, guest/host messaging after booking, payouts, and the wider guest/host/admin analytics described in the requirements.
- Property-document uploads and a complete inspection/improvement-report process.

Those integrations require product decisions, provider accounts, credentials, webhook configuration, and operational policies. The current enquiry form is not a booking or reservation.

## Local setup

1. Install Node.js 20 or newer and MongoDB Atlas (or another reachable MongoDB deployment).
2. Copy `.env.local.example` to `.env.local`.
3. In Firebase Console, create a Web App and enable **Authentication → Email/Password** and **Google**. Add the six `NEXT_PUBLIC_FIREBASE_*` web configuration values.
4. Configure Firebase Admin server credentials using `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Keep the service account private and outside Git.
5. Set `MONGODB_URI` to a database the development machine can resolve and connect to.
6. Set `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` to a mail account configured to send verification messages. Without these values, email registration returns a setup error rather than logging verification codes.
7. Set `SUPPORT_EMAIL` to the real guest-support inbox. Set `ADMIN_EMAILS` to comma-separated Firebase-verified admin email addresses. These accounts can use `/admin`.
8. Set `NEXT_PUBLIC_APP_URL` to the canonical public URL in deployed environments.
9. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Deploy Firebase Functions separately only if using their OTP/enquiry functions; the current web registration and enquiry routes use the Next.js server routes.

## Host and review workflow

1. Create a host account (or switch a verified guest account to host in the dashboard).
2. Submit a stay with at least three photos.
3. A configured administrator signs in with an address in `ADMIN_EMAILS`, opens `/admin`, and approves or rejects the submission with improvement notes.
4. Only approved, active stays are returned by public browse and detail APIs. Editing an approved stay sends it back for review.

Existing property records created before verification was added are private from public search until an administrator reviews them. Legacy records may not have the new stay fields; review and update them before approval.

## Build and deploy

```bash
npm run build
npm run start
```

Configure all required Firebase, MongoDB, mail, support, and admin environment variables in the deployment provider. Keep service-account keys and `.env.local` out of source control.

## Data services

- **Firebase Authentication** — identity and sign-in.
- **MongoDB** — user profiles, stay listings, support enquiries, and one-time verification codes.
- **Firebase Storage** — host-uploaded listing photos.

The existing Firestore rules/functions remain in the repository for their legacy integrations; they do not provide the missing booking or payment functionality.
