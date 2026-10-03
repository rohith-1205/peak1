# Peak1 — Event Registration & Race Management Platform

![Peak1 Banner](https://img.shields.io/badge/Platform-Peak1-orange?style=for-the-badge)
![MERN STACK](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Peak1** is an enterprise-grade, high-performance Event Registration and Race Management SaaS platform built using the MERN stack (MongoDB, Express.js, React 18, Node.js) with Vite, Socket.IO real-time sync, dynamic form builders, JWT authentication, and Razorpay payment abstraction.

Designed specifically for professional event organizers managing:
- 🏎️ **Motorsports & Drag Races** (Quarter-mile drag, circuit criteriums, rally stages)
- 🏃 **Marathons & Trail Runs** (5K, 10K, 21K Half Marathon, 42K Ultra)
- 🚴 **Cycling Criteriums & Sports Challenges**
- 🏆 **College, Corporate & Community Competitions**

---

## 📑 Table of Contents
- [1. Architecture Overview](#1-architecture-overview)
- [2. Key Features & Capabilities](#2-key-features--capabilities)
- [3. Technology Stack](#3-technology-stack)
- [4. Repository Folder Structure](#4-repository-folder-structure)
- [5. Getting Started & Local Setup](#5-getting-started--local-setup)
- [6. Environment Variables Reference](#6-environment-variables-reference)
- [7. Database CLI & Management Commands](#7-database-cli--management-commands)
- [8. Mobile QR Camera Scanning Setup](#8-mobile-qr-camera-scanning-setup)
- [9. REST API Endpoint Reference](#9-rest-api-endpoint-reference)
- [10. Automated Testing](#10-automated-testing)
- [11. Production Security & Safety Guards](#11-production-security--safety-guards)
- [12. Troubleshooting Guide](#12-troubleshooting-guide)

---

## 1. Architecture Overview

```
                          +-----------------------------------+
                          |    React 18 + Vite (Peak1 Web)    |
                          |  Speed & Motion Design System     |
                          +-----------------------------------+
                                    |              ^
                    HTTPS REST API  |              | Socket.IO Live Scan Sync
                                    v              v
                          +-----------------------------------+
                          |     Express Node.js REST API      |
                          | (Security Guards, Controllers,    |
                          |   Services, Zod Validators)       |
                          +-----------------------------------+
                                /           |           \
                               /            |            \
                              v             v             v
                +------------------+ +-------------+ +--------------------+
                | MongoDB (Local / | |  Razorpay   | | Cloud Storage      |
                | Atlas Staging /  | |  Payment    | | (Multer / Sharp /  |
                | Production)      | | Engine      | | Cloudinary / S3)   |
                +------------------+ +-------------+ +--------------------+
```

---

## 2. Key Features & Capabilities

### 🌐 Participant Portal
- **Event Discovery & Filtering**: Search and filter upcoming or past events by category, status, or keyword.
- **Rich Event Specifications**: Detailed race information including category pricing tiers, schedules, venue maps, and entry requirements.
- **Express Registration Workflow**: Multi-step registration supporting dynamic requirement fields, emergency contact capture, and document uploads.
- **Integrated Payments**: Frictionless payment checkout with Razorpay modal, automatic retry handling, and digital invoice generation.
- **User Dashboard & Pass Management**: Real-time view of active registrations, tickets, digital pass QR code previews, and downloadable entry passes.

### 🛡️ Admin & Race Operations Suite
- **Analytics Overview**: Dashboard powered by Recharts visualizing revenue, registration volume, category breakdowns, and real-time activity feeds.
- **Dynamic Participant Requirements Builder**: Custom drag-and-drop form builder enabling admins to define per-event inputs (Text, Select dropdowns, Checkboxes, File Uploads).
- **Event Management**: Create, edit, publish, draft, or cancel events with configurable category pricing and participant limits.
- **Roster & Participant Management**: Search, filter, update registration status, view detailed profiles, and export CSV rosters.
- **Staff Access Control**: Create and manage staff accounts (`STAFF` role) for gate operations.

### 📱 Real-Time Live Gate Check-in System
- **Mobile Camera QR Scanner**: Built-in camera scanner (`html5-qrcode`) for fast on-site ticket verification.
- **Manual Ticket Verification**: Fallback entry panel for manual pass code entry.
- **Socket.IO Sync**: Real-time scan updates broadcast across all logged-in gate scanners to prevent double entry.
- **Signed Security QR Payloads**: Cryptographically hashed QR signatures (`QR_SIGNING_SECRET`) to prevent pass forgery.

---

## 3. Technology Stack

### Frontend Client
| Technology | Description |
|---|---|
| **React 18** | UI component framework with hooks architecture |
| **Vite 5** | High-performance frontend build tool & dev server |
| **React Router DOM 6** | Declarative client-side routing |
| **Lucide React** | Modern iconography set |
| **Recharts** | Interactive charts for admin analytics |
| **Framer Motion** | Dynamic micro-animations and smooth page transitions |
| **html5-qrcode & qrcode.react** | QR scanner and renderer components |
| **Socket.IO Client** | Real-time websocket connectivity for gate scanning |
| **Axios** | HTTP client with automatic JWT token interceptors |

### Backend Server
| Technology | Description |
|---|---|
| **Node.js & Express.js** | RESTful backend runtime and web application framework |
| **MongoDB & Mongoose** | Document database with schema enforcement |
| **Zod** | Strict schema validation for incoming API payloads |
| **JWT & Bcryptjs** | Stateless authentication tokens & secure password hashing |
| **Socket.IO** | Websocket engine for live event & scan updates |
| **Razorpay SDK** | Payment provider integration with webhook signature verification |
| **Multer & Sharp** | File uploading and automated image compression pipeline |
| **Cloudinary SDK** | Optional cloud image hosting provider integration |
| **Helmet & Express Rate Limit** | Hardened HTTP security headers and API rate limiting |

---

## 4. Repository Folder Structure

```
peak1/
├── server/
│   ├── src/
│   │   ├── config/             # DB, Environment, Security & Storage configuration
│   │   ├── constants/          # Application constants (roles, event/registration statuses)
│   │   ├── controllers/        # REST API Controllers (Auth, Event, Registration, Payment, Admin)
│   │   ├── middleware/         # Auth, Admin guard, Security, Upload & Error handling
│   │   ├── migrations/         # Schema migration runner and script versions
│   │   ├── models/             # Mongoose Models (User, Event, Registration, Payment, AuditLog)
│   │   ├── routes/             # Express REST router definitions
│   │   ├── services/           # Payment processing, mailer, & business logic engines
│   │   ├── socket.js           # Socket.IO event handler for live gate check-in
│   │   ├── utils/              # Seed scripts, index syncing, & response helpers
│   │   ├── validators/         # Zod schemas for input validation
│   │   ├── app.js              # Express middleware pipeline assembly
│   │   └── server.js           # App bootstrapper & DB connection entrypoint
│   ├── tests/                  # Integration test suite (Jest & Supertest)
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/         # Navigation, Layouts, Cards, Badges, Requirements Builder
│   │   │   └── gate/           # Gate scanner, camera panel, & scan history components
│   │   ├── context/            # AuthContext & Toast notification state
│   │   ├── pages/              # Participant & Admin application pages
│   │   ├── services/           # Axios API client & REST endpoints wrapper
│   │   ├── styles/             # Modular CSS stylesheets & animations
│   │   ├── App.jsx             # React router application root
│   │   └── main.jsx            # DOM entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions Automated CI pipeline
└── README.md
```

---

## 5. Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **MongoDB**: Community Server `v6.0+` running locally on `localhost:27017` or a MongoDB Atlas URI
- **npm**: `v9.x` or higher

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rohith-1205/peak1.git
   cd peak1
   ```

2. **Setup and Install Server**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

3. **Setup and Install Client**:
   ```bash
   cd ../client
   npm install
   ```

4. **Seed Development Database**:
   ```bash
   cd ../server
   npm run seed
   ```
   > ℹ️ *This creates sample events, users, and a default Admin account (`admin@peak1.app` / `Admin@123456`).*

5. **Start Development Servers**:
   - **Backend API Server** (runs at `http://localhost:5000`):
     ```bash
     cd server
     npm run dev
     ```
   - **Frontend Vite Client** (runs at `http://localhost:5173`):
     ```bash
     cd client
     npm run dev
     ```

---

## 6. Environment Variables Reference

Create a `.env` file in the `server/` directory:

```env
# Server Runtime Mode & Port
NODE_ENV=development
PORT=5000

# Database Connection
MONGO_URI=mongodb://localhost:27017/peak1_dev

# Authentication & Security Secrets
JWT_SECRET=super_secret_jwt_key_change_in_production_peak1_2026
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=8h
ALLOW_ADMIN_PUBLIC_LOGIN=false

# Default Admin Credentials (for seed script)
ADMIN_EMAIL=admin@peak1.app
ADMIN_PASSWORD=Admin@123456

# Cryptographic QR Pass Signing Secret (Minimum 32 characters)
QR_SIGNING_SECRET=peak1_qr_secret_dev_32_characters_long_key_string

# Client URL (for CORS policy)
CLIENT_URL=http://localhost:5173

# Payment Gateway Configuration (Razorpay)
PAYMENT_PROVIDER=RAZORPAY
RAZORPAY_KEY_ID=rzp_test_PEAK1DEVKEY123
RAZORPAY_KEY_SECRET=rzp_test_PEAK1DEVSECRET456
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_dev

# Storage Configuration (local | cloudinary | s3)
STORAGE_PROVIDER=local
UPLOAD_PATH=public/uploads

# Cloudinary Storage Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email Configuration (Optional)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_pass
EMAIL_FROM=noreply@peak1.app
```

---

## 7. Database CLI & Management Commands

All database management scripts are executed from the `server/` folder:

| Command | Purpose |
|---|---|
| `npm run seed` | Seeds full mock data (events, participants, registrations, admin) for development. |
| `npm run seed:admin` | Provisions or updates the default Admin account from environment variables. |
| `npm run db:indexes` | Synchronizes and builds defined MongoDB collection indexes. |
| `npm run migrate` | Runs schema migrations in **dry-run mode** (previews changes without applying). |
| `node src/migrations/runner.js --apply` | Applies pending database schema migrations to the target database. |

---

## 8. Mobile QR Camera Scanning Setup

> [!IMPORTANT]
> Modern web browsers enforce strict security policies restricting camera access (`navigator.mediaDevices.getUserMedia`) to **HTTPS contexts** or `localhost`.

To test physical mobile phone QR scanning on your local network:

1. **Start an HTTPS tunnel** (using [ngrok](https://ngrok.com/)):
   ```bash
   ngrok http 5173
   ```
2. **Access the Gate Page**: Open the generated `https://xxxx.ngrok-free.app/admin/gate` link on your mobile browser.
3. **Grant Camera Access**: Allow camera permissions when prompted to initiate real-time ticket scanning.

---

## 9. REST API Endpoint Reference

### Auth Endpoints (`/api/v1/auth`)
- `POST /register`: Register a new user account.
- `POST /login`: Authenticate participant user and receive JWT.
- `POST /admin/login`: Authenticate admin/staff user.
- `GET /me`: Retrieve logged-in user profile.

### Event Endpoints (`/api/v1/events`)
- `GET /`: List all active published events (supports category & search filters).
- `GET /:slugOrId`: Retrieve detailed event information.
- `POST /`: *(Admin)* Create a new event.
- `PUT /:id`: *(Admin)* Update event details or participant requirements.
- `DELETE /:id`: *(Admin)* Soft delete or cancel an event.

### Registration Endpoints (`/api/v1/registrations`)
- `POST /`: Submit event registration & generate payment order.
- `GET /my`: Retrieve registrations for the authenticated user.
- `GET /:id`: Retrieve specific registration pass and QR details.
- `POST /verify-gate`: *(Admin/Staff)* Verify ticket code or QR payload for check-in.

### Payment Endpoints (`/api/v1/payments`)
- `POST /create-order`: Initialize Razorpay payment order.
- `POST /verify`: Verify Razorpay HMAC signature after payment completion.
- `POST /webhook`: Webhook endpoint for idempotent server-to-server payment updates.

### Admin Operations (`/api/v1/admin`)
- `GET /overview`: Fetch system analytics metrics and chart data.
- `GET /registrations`: List all registrations with status filters.
- `PATCH /registrations/:id/status`: Update registration status manually.
- `GET /registrations/export`: Export filtered event rosters as CSV.
- `GET /staff` & `POST /staff`: Manage staff credentials.

### File Upload (`/api/v1/upload`)
- `POST /image`: Upload and optimize image asset (posters, banners, ID documents).

---

## 10. Automated Testing

The backend includes an integration test suite using **Jest**, **Supertest**, and **MongoDB Memory Server**:

```bash
cd server
npm test
```

---

## 11. Production Security & Safety Guards

> [!CAUTION]
> 1. **Environment Protection**: The backend automatically checks database connections on boot. If `NODE_ENV === 'production'` and `MONGO_URI` points to a `localhost` instance, the server halts immediately.
> 2. **Seed Guard**: Database seeding scripts (`seed` and `seed:admin`) are blocked from execution in production environments.
> 3. **Server-Side Price Validation**: Payment amounts are strictly computed from backend database records. Client-provided prices are ignored to prevent request tampering.
> 4. **Strict Security Headers**: Helmet enforces HTTP security headers and CORS is locked down to your configured `CLIENT_URL`.

---

## 12. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `MongoServerError: connect ECONNREFUSED` | Local MongoDB server is not running | Start your local MongoDB service (`net start MongoDB` or run `mongod`). |
| `FATAL PRODUCTION SAFETY ERROR` | `NODE_ENV=production` paired with `localhost` URI | Update `.env` with your production MongoDB Atlas URI. |
| `Razorpay Signature Verification Failed` | Secret key mismatch | Ensure `RAZORPAY_KEY_SECRET` in `.env` matches your Razorpay Dashboard. |
| `CORS Policy Block` | Origin mismatch | Update `CLIENT_URL` in `server/.env` to match your frontend origin. |
| `Camera Not Available` | Insecure HTTP context | Access the Gate Scanner over `https://` or test on `localhost`. |

---

<p align="center">
  <b>Peak1 Platform</b> — Engineered for Speed, Reliability, and Seamless Event Management.
</p>
