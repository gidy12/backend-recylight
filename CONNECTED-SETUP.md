# RecyLight connected frontend + backend

This package combines the storefront frontend with the Express/MongoDB backend and connects the frontend API client to the backend endpoints.

## 1. Deploy the backend

1. Open the `backend` folder in VS Code (or deploy that folder as the Render service root).
2. Run `npm install`.
3. Copy `.env.example` to `.env` for local development.
4. Set `MONGODB_URI`, a long random `JWT_SECRET`, `FRONTEND_ORIGINS` (the exact deployed storefront origin, with no trailing slash), `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
5. Run `npm run dev` locally, or deploy the backend folder to Render using `npm install` and `npm start`.
6. Confirm the backend root URL returns its health response.

## 2. Point the storefront to the backend

Open the root `api.js`. At the top, update the default URL to your deployed backend URL:

```js
const BASE_URL = (window.RECYLIGHT_API_BASE_URL || 'https://YOUR-BACKEND.onrender.com').replace(/\/$/, '');
```

Do not include a trailing slash. Commit and redeploy the frontend to Vercel.

## 3. Admin login

Open `/login.html` on the deployed site and sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the backend environment. The backend creates the initial admin user on startup. Do not create admin credentials in browser storage.

## 4. What is connected

- Customer signup, login, session validation and logout
- Public product catalog and category filters
- Checkout order creation (server recalculates prices from database records)
- Admin login and session validation
- Admin product create, edit and archive
- Admin order list and status updates
- Admin dashboard summary

## 5. Still requires configuration / future work

- MTN MoMo is **not a live payment integration** yet. The current payment endpoint creates a pending manual-payment record only. Configure official MTN MoMo merchant credentials and verified callbacks before accepting live payments. Never mark a payment paid based only on a customer screenshot.
- Password reset email is not configured; the backend returns a clear not-configured response.
- Product images should preferably be HTTPS image URLs from Cloudinary or another image host. This build resizes uploaded images before sending them, but long-term image hosting is recommended.
- Customer enquiries/chat and store profile settings remain browser-local; they are not part of the backend API yet.
- Guest checkout works. Orders are linked to a customer account only when the request has a valid customer JWT.

## 6. Important

Never put MongoDB credentials, JWT secrets, or admin passwords in frontend files or GitHub. Keep them only in backend environment variables. Add the exact Vercel production URL and any preview URL you use to `FRONTEND_ORIGINS`.
