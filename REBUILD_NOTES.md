# TasteHub Rebuild Notes

## Rebuilt now

- Resend email utility for password reset mail.
- OTP forgot-password flow:
  - `POST /api/user/forgot-password`
  - `POST /api/user/verify-otp`
  - `POST /api/user/reset-password`
- Auth and OTP rate limiting.
- User reset OTP fields.
- Admin signup route removed from the API.
- Admin signup UI removed.
- Admin signin crash fixed.
- Client global toast added.
- Client SPA routing config added for Vercel.
- Server debug database endpoint removed.
- Server CORS restricted to local dev and `CORS_ORIGIN`.
- Server body limit reduced to `10mb`.
- Admin Vite dev port changed to `5173`.
- Admin seed script added at `server/scripts/seedAdmin.js`.

## Environment variables

### server

```env
MONGODB_URL=
JWT_SECRET=
PORT=8080
CORS_ORIGIN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PAYSTACK_SECRET_KEY=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### client

```env
REACT_APP_API_BASE_URL=https://your-backend.onrender.com/api
```

### admin

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

## Phase 2 later

These are intentionally not implemented in this rebuild commit.

- Real-time order tracking with Socket.io.
- Admin order status management with live customer updates.
- Admin analytics dashboard for revenue, orders, users, and popular items.
- Upstash Redis caching for products and popular listings.
