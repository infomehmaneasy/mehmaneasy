# Mehmaan Easy

Curated stays marketplace — Next.js (App Router) + Tailwind + Framer Motion, with Firebase authentication and MongoDB property listings.

The guest-facing experience is designed around finding and hosting stays. The current listing schema still stores monthly rental and real-estate-style property records; nightly rates, booking availability, payments, and reservation workflows need to be added before guests can complete a stay booking.

## 1. Firebase project setup
1. Create a project at console.firebase.google.com.
2. Enable **Authentication → Email/Password**.
3. Enable **Firestore** (production mode) and **Storage**.
4. Add a Web App and copy the config into `.env.local` (copy `.env.local.example` → `.env.local`, fill in all six `NEXT_PUBLIC_FIREBASE_*` values, then restart `npm run dev` — Next.js only reads env files on startup). Until this is done, the app shows a setup screen instead of crashing.
5. In Google Cloud Console, create an **App Password** for a Gmail account you control (or swap Nodemailer for SendGrid/Mailgun in `functions/index.js`).

## 2. Install
```bash
npm install
cd functions && npm install && cd ..
```

## 3. Configure the email sender for Cloud Functions
```bash
firebase functions:config:set gmail.email="you@gmail.com" gmail.app_password="xxxx xxxx xxxx xxxx"
```

## 4. Deploy backend
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules,functions
```

## 5. Seed 50+ demo listings
All seeded properties are owned by `sumitranjanhisu@gmail.com` (auto-created in Firebase Auth if it doesn't exist yet, temp password printed to the console).
```bash
# Download a service account key (Project settings → Service accounts) and
# save it as ./serviceAccountKey.json, then:
npm run seed
```

## 6. Run locally
```bash
npm run dev
```
## 7. Repush and run build
```bash
npm run build
git add .
git commit -m "3d ui design"
git push -u origin main
```
## How the pieces fit together
- **OTP verification**: `sendOtp`/`verifyOtp` Cloud Functions (custom 6-digit code, since Firebase Auth has no native email-OTP primitive) — see `functions/index.js`.
- **Location sorting + ad injection**: `hooks/useNearbyProperties.js` sorts by Haversine distance from the browser's geolocation and interleaves `isFeatured` listings as ad banners every 4–6 cards.
- **Enquiries → email**: `EnquiryModal` writes to `enquiries/{id}`; the `onEnquiryCreated` Firestore trigger emails the seller and a confirmation to the buyer.
- **Security**: `firestore.rules` restricts property edits/deletes to `ownerUid`, and `otps/{email}` is server-only.
