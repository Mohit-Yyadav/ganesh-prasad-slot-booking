# Ganesh Prasad Slot Booking Portal

A full-stack MERN application for booking Ganesh Prasad distribution slots
(14–25 September), with public booking + status pages and a protected admin
panel for verification and slot management.

## Core Business Rule

> **One Date + One Session = One Allotted Applicant.**

This is enforced at the database level:

- The `Slot` collection has a **unique compound index** on `{ date, session }`
  — there can only ever be one Slot document per date/session pair.
- Approving an application performs an **atomic, condition-guarded update**:
  `Slot.findOneAndUpdate({ date, session, status: "available" }, { $set: { status: "allotted", ... } })`.
  If two admins approve two different applications for the same slot at the
  same instant, only the first request's atomic update can match
  `status: "available"` — the second is rejected with a clear "already
  allotted" error. No multi-document transaction or extra locking is needed,
  and no replica set is required.
- Any other still-pending applications for the same date + session are
  automatically closed out with a "slot allotted to another applicant"
  message once one is approved.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, React Hook Form + Zod, Axios, Sonner, Lucide React
- **Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt
- **Security:** helmet, cors, express-rate-limit, express-mongo-sanitize

## Project Structure

```
ganesh-prasad-portal/
├── client/     React frontend
├── server/     Express + MongoDB backend
├── .env.example
└── README.md
```

## Local Development

### 1. Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

### 2. Install dependencies

```bash
npm run install:all
```

(or manually: `cd server && npm install`, then `cd ../client && npm install`)

### 3. Configure environment variables

Copy the example env file and fill in real values:

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ganesh_prasad_portal
JWT_SECRET=<generate a long random string>
CLIENT_URL=http://localhost:5173
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<choose a strong password>
SEED_ADMIN_NAME=Portal Admin
```

For the client, create `client/.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Seed the database

This creates the 12 event dates (14–25 September) with Morning/Evening slots
set to "available", and creates the admin account from your `.env` values.

```bash
npm run seed
```

### 5. Run the app

In two terminals:

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

Visit `http://localhost:5173` for the public site and
`http://localhost:5173/admin/login` for the admin panel.

## API Overview

### Public

| Method | Endpoint                        | Description                        |
|--------|----------------------------------|-------------------------------------|
| GET    | `/api/slots`                    | All configured dates + availability |
| GET    | `/api/slots/:date`               | Availability for one date          |
| POST   | `/api/applications`              | Submit a booking application       |
| GET    | `/api/applications/status`       | Look up status by `applicationId` or `mobile` |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Endpoint                                   | Description                     |
|--------|----------------------------------------------|----------------------------------|
| POST   | `/api/admin/login`                         | Get a JWT                       |
| GET    | `/api/admin/dashboard`                     | Stats overview                  |
| GET    | `/api/admin/applications`                  | List with search/filter/sort/pagination |
| GET    | `/api/admin/applications/:id`              | Single application               |
| PATCH  | `/api/admin/applications/:id/approve`      | Approve + atomically allot slot |
| PATCH  | `/api/admin/applications/:id/reject`       | Reject an application            |
| GET    | `/api/admin/slots`                         | List all slots                   |
| PATCH  | `/api/admin/slots/:id`                     | Open/close a slot (not allotted) |
| GET    | `/api/admin/applications/export`           | CSV export                       |

## Production Deployment Notes

1. **Database:** Use MongoDB Atlas (or another managed MongoDB). Set
   `MONGO_URI` accordingly. No replica set requirement beyond what Atlas
   already provides — the app does not rely on multi-document transactions.
2. **Backend:** Deploy `server/` to any Node host (Render, Railway, EC2,
   etc.). Set all variables from `.env.example` as real environment
   variables — never commit `.env`. Set `NODE_ENV=production` and
   `CLIENT_URL` to your deployed frontend origin.
3. **Frontend:** Run `npm run build --prefix client` to produce a static
   `client/dist` build, and deploy it to any static host (Vercel, Netlify,
   S3 + CloudFront, or served by the same Node host). Set
   `VITE_API_BASE_URL` to your deployed backend's `/api` URL at build time.
4. **Admin account:** Never reuse the seed password in production. Rotate it
   immediately after first login, or seed with a fresh strong password via
   environment variables in your deployment pipeline.
5. **HTTPS:** Terminate TLS at your host/load balancer — cookies and the
   JWT should only ever travel over HTTPS in production.
6. **Rate limiting:** Defaults are conservative (10 applications / 15 min
   per IP, 20 login attempts / 15 min per IP). Tune via `.env` for your
   expected traffic.

## Testing Checklist

- [ ] Booking: view dates → select available session → submit → invalid
      mobile rejected → empty fields rejected
- [ ] Duplicate protection: two applications for the same slot; approving
      one auto-rejects the other; approving the same slot twice returns a
      clear "already allotted" error
- [ ] Admin: login required for all `/admin/*` routes; approve; reject;
      search; filter; slot open/close
- [ ] Responsive: 360px, 390px, tablet, laptop, desktop
