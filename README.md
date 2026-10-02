# Peak1 — Event Registration & Race Management Platform

**Peak1** is an enterprise-grade, high-performance Event Registration and Race Management SaaS platform built using the MERN stack (MongoDB, Express, React, Node.js) with Vite, Tailwind/Vanilla CSS, JWT authentication, and Razorpay modular payment provider abstraction.

Designed specifically for professional event organizers running:
- **Motorsport & Drag Races** (Quarter mile drag, circuit criteriums, rally stages)
- **Marathons & Trail Runs** (5K, 10K, 21K Half Marathon, 42K Ultra)
- **Cycling Criteriums & Sports Challenges**
- **College, Corporate & Community Competitions**

---

## 1. Project Overview
Peak1 operates as a **single-organization event platform** owned and managed by a single administrator (Admin). There is no multi-tenant or multi-organizer complexity.

**Workflow**:
- **ADMIN**: Creates, edits, publishes events, configures dynamic registration forms, sets pricing (Free/Paid), tracks payments, manages rosters, exports CSVs, and performs live gate QR check-ins.
- **PUBLIC USERS / PARTICIPANTS**: Browse official events, view race specifications, register for passes, pay securely via Razorpay, and view QR passes on their dashboard.

---

## 2. Architecture Diagram

```
                       +-----------------------------------+
                       |    React 18 + Vite (Peak1 Web)    |
                       |  Speed & Motion Design System     |
                       +-----------------------------------+
                                         |
                                         | HTTPS / REST API
                                         v
                       +-----------------------------------+
                       |    Express Node.js REST API       |
                       | (Security Guards, Controllers,    |
                       |   Services, Zod Validators)       |
                       +-----------------------------------+
                             /           |           \
                            /            |            \
                           v             v             v
             +------------------+ +-------------+ +--------------------+
             | MongoDB (Local / | |  Razorpay / | | Cloud Storage      |
             | Atlas Staging/   | |  Payment    | | (Multer / Cloudinary|
             | Production)      | |  Provider   | | / AWS S3)          |
             +------------------+ +-------------+ +--------------------+
```

---

## 3. Technology Stack
- **Frontend**: React 18, Vite, React Router DOM, Lucide Icons, QRCode.react, Framer Motion
- **Backend**: Node.js, Express.js, Mongoose, Zod Validation, JWT Authentication, Bcryptjs
- **Database**: MongoDB (Local for Dev, Atlas for Staging/Production), MongoDB Compass GUI
- **Payments**: Modular Payment Service Architecture (Default: Razorpay with Webhook Idempotency)
- **Security**: Helmet, CORS, Express Rate Limiting, Startup Production Guards

---

## 4. Folder Structure

```
peak1/
├── server/
│   ├── src/
│   │   ├── config/             # DB, Environment, Security config
│   │   ├── constants/          # Event statuses, roles, categories
│   │   ├── controllers/        # Auth, Event, Registration, Payment, Admin controllers
│   │   ├── middleware/         # Auth, Admin guard, Error handler, Rate limiters
│   │   ├── models/             # Mongoose Schemas (User, Event, Registration, Payment, AuditLog)
│   │   ├── routes/             # Express REST endpoint routes
│   │   ├── services/           # Business & payment logic engines
│   │   ├── utils/              # Seed script, ApiResponse helpers
│   │   ├── validators/         # Zod schemas for input validation
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Database connection & server entrypoint
│   ├── tests/                  # Jest & Supertest integration suite
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, EventCard, StatusBadge, ProtectedRoutes
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/              # Home, EventBrowse, EventDetail, Login, Register, Dashboards
│   │   ├── services/           # Axios API client with JWT interceptor
│   │   ├── styles/ / index.css # Speed & Motion Design System Tokens & Animations
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions Automated CI/CD
└── README.md
```

---

## 5. Local Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB Community Server (v6.0+) running locally on port `27017`
- npm or yarn package manager

### Step-by-Step Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/peak1.git
   cd peak1
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Seed the Local Development Database**:
   ```bash
   cd ../server
   npm run seed
   ```
   *Output will display default Admin credentials (`admin@peak1.app` / `Admin@123456`).*

5. **Start Development Servers**:
   - Backend API (`http://localhost:5000`):
     ```bash
     cd server
     npm run dev
     ```
   - Frontend Vite Client (`http://localhost:5173`):
     ```bash
     cd client
     npm run dev
     ```

---

## 6. MongoDB Installation
- Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community).
- Ensure the MongoDB Windows Service or `mongod` daemon is active on `localhost:27017`.

---

## 7. MongoDB Compass Setup
- Open MongoDB Compass GUI.
- Connect to string: `mongodb://localhost:27017/peak1_dev`.
- Inspect collections: `users`, `events`, `registrations`, `payments`, `auditlogs`.

---

## 8. MongoDB Atlas Setup (Staging & Production)
1. Create a MongoDB Atlas cluster.
2. Create separate database instances:
   - Staging: `peak1_staging`
   - Production: `peak1_prod`
3. Configure Network Access IP Whitelist for deployment hosts.

---

## 9. Environment Variables (`.env.example`)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/peak1_dev

JWT_SECRET=super_secret_jwt_key_change_in_production_peak1_2026
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=8h
ALLOW_ADMIN_PUBLIC_LOGIN=false

ADMIN_EMAIL=admin@peak1.app
ADMIN_PASSWORD=Admin@123456

QR_SIGNING_SECRET=peak1_qr_secret_dev_32_characters_long_key_string

CLIENT_URL=http://localhost:5173

PAYMENT_PROVIDER=RAZORPAY
RAZORPAY_KEY_ID=rzp_test_PEAK1DEVKEY123
RAZORPAY_KEY_SECRET=rzp_test_PEAK1DEVSECRET456
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_dev

STORAGE_PROVIDER=local
UPLOAD_PATH=public/uploads

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 16. Database Migrations & Admin Provisioning

### Database Migrations
Database migration scripts support **dry-run mode** by default to inspect structural changes without mutating records:

- **Dry-Run Inspection**:
  ```bash
  cd server
  npm run migrate
  ```
- **Apply Migration Changes**:
  ```bash
  cd server
  node src/migrations/runner.js --apply
  ```

### Provisioning Admin User
Provision or update administrator credentials securely from environment variables (`ADMIN_EMAIL` & `ADMIN_PASSWORD`):

```bash
cd server
npm run seed:admin
```
*Note: In production (`NODE_ENV=production`), `ADMIN_PASSWORD` must be at least 12 characters long and cannot be default `Admin@123456`.*

---

## 16b. Mobile Phone Camera Scanning & HTTPS/ngrok Setup
> [!IMPORTANT]
> Modern web browsers enforce strict security rules for camera access (`navigator.mediaDevices.getUserMedia`). Camera feeds **only operate under secure HTTPS contexts** or `localhost`.
>
> When testing real-time QR camera scanning on physical mobile phones on your local Wi-Fi network:
> 1. Use an HTTPS tunneling tool like **ngrok**:
>    ```bash
>    ngrok http 5173
>    ```
> 2. Open the generated HTTPS URL (`https://xxxx.ngrok-free.app/admin/gate`) on your mobile browser.
> 3. Grant camera permissions when prompted.


---

## 17. Backup Strategy
- Enable MongoDB Atlas Continuous Cloud Backups (Point-in-Time Recovery).
- Retain daily automated snapshots for 30 days.

---

## 18. Restore Procedure
1. Freeze active backend deployment or set API into maintenance mode.
2. Select target backup snapshot timestamp in MongoDB Atlas Console.
3. Trigger cluster restore to staging environment first to verify data integrity.
4. Update API database connection string to point to restored instance.

---

## 19. Payment Configuration (Razorpay)
1. Obtain API Key ID & Secret from Razorpay Dashboard.
2. Set webhook target URL: `https://api.peak1.app/api/v1/payments/webhook`.
3. Enable webhook event: `payment.captured`.
4. Webhook handler automatically enforces HMAC-SHA256 signature verification and idempotency.

---

## 20. Image & File Storage Configuration
- Local storage saves posters to `server/public/uploads`.
- For cloud storage, update `STORAGE_PROVIDER=S3` or `CLOUDINARY` in `env.js`.

---

## 21. Email Notification Service Configuration
- Configured via SMTP credentials (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
- Compatible with AWS SES, SendGrid, or Mailtrap.

---

## 22. Security Practices
- Passwords hashed with bcryptjs (salt rounds = 10).
- Stateless JWT auth tokens.
- CORS restricted to explicit `CLIENT_URL`.
- Express Rate Limiting (300 requests per 15 min window).
- Zod strict input validation schemas for all mutating API routes.

---

## 23. Production Safety Rules

> [!CAUTION]
> 1. The server boot process enforces environment verification (`src/config/env.js`). If `NODE_ENV === 'production'` and `MONGO_URI` contains `localhost`, server halts immediately.
> 2. Seed and reset scripts explicitly reject execution when `NODE_ENV === 'production'`.
> 3. Server always dictates payment price based on database records; amounts sent from frontend are never trusted.

---

## 24. Automated Testing
Run backend unit and integration test suite:
```bash
cd server
npm test
```

---

## 25. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `MongoServerError: connect ECONNREFUSED` | Local MongoDB service is stopped | Start MongoDB service (`net start MongoDB` or launch Compass) |
| `FATAL PRODUCTION SAFETY ERROR` | `NODE_ENV=production` set with localhost URI | Update `.env` to point to MongoDB Atlas cluster URI |
| `Razorpay Signature Verification Failed` | Mismatched secret key | Verify `RAZORPAY_KEY_SECRET` matches Razorpay dashboard |
| `CORS Error in Browser` | `CLIENT_URL` mismatch | Set `CLIENT_URL=http://localhost:5173` in `server/.env` |

---

*Peak1 Platform — Built with Speed, Movement, and Data Integrity.*
