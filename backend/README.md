# RecyLight Ltd Backend

Node.js + Express + MongoDB REST API designed around the current RecyLight frontend's `api.js` routes.

## Features
- Customer signup/login and JWT authentication
- Admin login and role-protected dashboard routes
- Public products and categories
- Admin product create/update/archive
- Order creation with server-side product-price and stock validation
- Customer order history and limited public order tracking
- Manual payment reference records and admin verification
- CORS allowlist, Helmet, request rate limiting on login, password hashing

## Important payment note
The manual payment endpoint creates a pending reference only. It does **not** request money from MTN or verify a transfer. Do not mark a payment paid until the payment is confirmed through your MTN MoMo merchant portal/provider. A real MTN MoMo Collection API integration requires merchant credentials, a subscription key, API user/key, environment configuration and provider callback handling. Never put those secrets in frontend code.

## 1. Requirements
- Node.js 20+
- MongoDB Atlas database (or local MongoDB)
- Git and a Render account for deployment

## 2. Install locally
```bash
npm install
cp .env.example .env
```
On Windows PowerShell, use:
```powershell
Copy-Item .env.example .env
```
Edit `.env`. Set `MONGODB_URI`, a long random `JWT_SECRET`, frontend origins, and a unique admin password of at least 12 characters.

## 3. Run
```bash
npm run dev
```
API runs at `http://localhost:5000`.
Check `http://localhost:5000/` and `/health`.

## 4. Seed starter catalog
The frontend's `products-data.js` contains demo products. This backend deliberately does not auto-import demo fixtures as real stock. Add real products from the admin API after logging in, or import verified stock data with a trusted script.

## 5. Deploy to Render
Create a **Web Service** from this backend folder/repository:
- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node
- Add environment variables from `.env.example`
- `MONGODB_URI` must point to MongoDB Atlas or another reachable MongoDB service.
- `FRONTEND_ORIGINS` must contain the exact deployed frontend origin, with no trailing slash, e.g. `https://recylight-recy-light.vercel.app`

Do not commit `.env`.

## 6. Frontend API base URL
The supplied frontend's `api.js` already defaults to:
`https://recylight-api.onrender.com`

For local testing, before `api.js` loads, set:
```html
<script>window.RECYLIGHT_API_BASE_URL = 'http://localhost:5000';</script>
```
Use the actual Render URL after deployment.

## 7. Routes implemented

### Customer auth
- `POST /api/v1/auth/customer/signup` `{ full_name, name, email, email_address, password }`
- `POST /api/v1/auth/customer/login` `{ email, username, password }`
- `GET /api/v1/auth/customer/me`
- `POST /api/v1/auth/customer/logout`
- Forgot/reset password currently return 501 until an email provider and secure reset-token flow are configured.

### Admin auth
- `POST /api/v1/auth/admin/login` `{ email, password }`
- `GET /api/v1/auth/admin/me`
- `POST /api/v1/auth/admin/logout`

### Catalog
- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/:slug`
- `GET /api/v1/catalog/categories`

### Orders
- `POST /api/v1/orders`
- `GET /api/v1/orders/mine` (customer token required)
- `GET /api/v1/orders/:orderNumber` (returns limited tracking status)

The order endpoint currently accepts guest checkout because that is how the supplied checkout UI is designed. The server recalculates totals from database prices and checks available stock. It does not yet reserve/decrement stock at order creation.

### Payments
- `POST /api/v1/payments/manual` `{ order_id, amount, phone }`
- `GET /api/v1/payments/:paymentId/status`
- `GET /api/v1/payments/admin/pending` (admin)
- `PATCH /api/v1/payments/:paymentId/verify` (admin)

### Admin dashboard
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id` (archives)
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/reports`
- `GET /api/v1/admin/reports/sales`

All `/api/v1/admin/*` routes require a valid admin JWT.

## 8. Important frontend integration work still required
The current storefront's `api.js` already defines calls for these endpoints. However:
- `admin-login.js` currently stores admin credentials/session in browser localStorage/sessionStorage; it must be changed to call `RecyLightAPI.adminLogin()` and verify the session with `adminMe()`.
- `admin.js` currently saves products, settings and enquiries only in localStorage. It must be connected to `getAdminProducts`, `createAdminProduct`, `patchAdminProduct`, `deleteAdminProduct`, `getAdminOrders`, `patchAdminOrderStatus`, `getAdminDashboard`, and report methods to make admin changes shared across devices.
- The current admin HTML contains a local-preview banner and placeholder order/report content; the UI needs updating to display API-backed data.
- Customer profile update and password reset are not fully implemented in the existing frontend/backend contract.
- The current image uploader stores base64 data in browser storage. For production, use an image hosting provider such as Cloudinary and store the returned HTTPS URL in `image`. Do not store large base64 images in MongoDB documents.
- Customer checkout is guest-enabled in this backend to match the current form. To associate orders with accounts, send the customer JWT and optionally require login.

## 9. Security before launch
- Use HTTPS.
- Use a unique strong admin password and JWT secret.
- Restrict CORS to your exact domains.
- Keep secrets only in Render environment variables.
- Configure database backups and monitoring.
- Confirm payment receipt with MTN before marking an order paid.
- Add email verification/password reset, image upload service, audit logs, and stock reservation/transaction handling before accepting significant real orders.
