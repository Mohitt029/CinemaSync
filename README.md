<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=200&section=header&text=CinemaSync&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=India's%20premium%20ticketing%20platform&descAlignY=58&descSize=18" width="100%" />

<a href="#-overview"><img src="https://img.shields.io/badge/Overview-0f0f1e?style=for-the-badge&logo=readthedocs&logoColor=e50914" /></a>
<a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-0f0f1e?style=for-the-badge&logo=diagramsdotnet&logoColor=e50914" /></a>
<a href="#-features"><img src="https://img.shields.io/badge/Features-0f0f1e?style=for-the-badge&logo=spring&logoColor=e50914" /></a>
<a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-0f0f1e?style=for-the-badge&logo=rocket&logoColor=e50914" /></a>

<br />

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Material UI](https://img.shields.io/badge/MUI_5-007FFF?style=flat-square&logo=mui&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-e50914?style=flat-square)

**A production-grade, microservices-based ticketing platform — built end-to-end from scratch.**  
Movies · Concerts · Sports · Theatre · Real-time seat locks · Razorpay payments · Google OAuth

</div>

---

## 🎬 Overview

**CinemaSync** is a full-stack, three-service microservice application that replicates the core experience of BookMyShow / Paytm Insider — with a **premium dark UI**, **real payment flow**, and **concurrent seat locking** that actually holds up under load.

What started as a "build a movie ticket app" exercise grew into a real distributed system exercising:

- **Distributed state** — three independent services with their own databases and lifecycles
- **Concurrency** — atomic seat locks, TTL expiry, race-condition handling
- **Payments** — real Razorpay order creation, HMAC-SHA256 signature verification, idempotent confirmation
- **Auth** — JWT + Google OAuth ID-token verification, per-user data isolation
- **Resilience** — retry-safe confirmations, self-healing expired locks, graceful fallbacks

> **Why "CinemaSync"?** Every seat, lock, payment, and confirmation stays *in sync* — across services, sessions, and tabs.

---

## 🏗 Architecture

### The Three Services

CinemaSync is deliberately split into three independent Spring Boot services, each owning its own domain and its own MongoDB database. They talk to each other over plain HTTP and never share a database, which is what makes the platform genuinely distributed rather than a monolithic app dressed up with extra ports.

**`auth-service` (port 8081)** is the gatekeeper. It owns everything about identity: registering a user, hashing their password with BCrypt, issuing a JWT on successful login, verifying the ID token that Google hands back when someone signs in with their Google account, and running the whole password-reset flow — generating a cryptographic token, hashing it, emailing the raw version via Gmail SMTP, and later verifying it when the user clicks the link. It stores its data in `cinemasync_auth`.

**`event-service` (port 8082)** is the catalogue. It's what users browse — events, showtimes, geo-search, filtering by category / language / format / time-slot. It also hosts SyncBot, the AI chatbot that answers user questions using a hybrid of the Gemini API (when configured) and a rule-based fallback that keeps working even with no API key. Its data lives in `cinemasync_events`.

**`booking-service` (port 8084)** is the engine room — and the hardest service. It owns the seat matrix for every showtime, the locking mechanism that holds seats for ten minutes while a user pays, the Razorpay integration that creates orders and verifies payment signatures, and the booking lifecycle from PENDING to CONFIRMED to CANCELLED. Its data lives in `cinemasync_bookings`.

### How They Fit Together

Think of it as a three-lane highway with the React frontend at the on-ramp:

```
  Frontend (React, :3000)
        │
        ├──────────► auth-service (:8081)  ──► cinemasync_auth
        │              │
        │              └──► Google OAuth API + Gmail SMTP
        │
        ├──────────► event-service (:8082) ──► cinemasync_events
        │              │
        │              └──► Gemini API (optional)
        │
        └──────────► booking-service (:8084) ──► cinemasync_bookings
                       │
                       └──► Razorpay API
```

The frontend never talks to a database. It only knows the three service URLs. Each service talks to its own database and (when needed) to a third-party API. No service reads another service's database. This keeps boundaries clean and means a schema change in `booking-service` can never accidentally break `auth-service`.

### Port Map

| Service | Port | Owns | Third-party integrations |
|---------|------|------|--------------------------|
| **auth-service** | 8081 | Users, sessions, password reset | Google OAuth, Gmail SMTP |
| **event-service** | 8082 | Events, showtimes, chatbot | Gemini API (optional) |
| **booking-service** | 8084 | Seats, locks, payments, bookings | Razorpay |
| **frontend** | 3000 | UI | Google Identity, Razorpay Checkout |

---

## 🔄 The Concurrency Story 

The hardest part of a ticketing platform isn't the UI or the login — it's making sure **two people never book the same seat**, and that a seat doesn't stay locked forever if someone abandons a payment midway. CinemaSync handles this with a **lock-then-confirm** model, and the story of a single booking goes like this:

**Act I — The Lock.** A user opens the seat map, taps seat `C6`, and clicks "Lock". The frontend calls `POST /api/seats/lock` on booking-service. In a single synchronized method, the server checks that `C6` is currently `AVAILABLE`, flips it to `LOCKED`, tags it with the user's ID, stamps it with a `expiresAt` timestamp ten minutes in the future, and returns success. If two users click `C6` at the same instant, the Java `synchronized` keyword serializes the calls — the first wins, the second gets a clean "Seat C6 is currently locked" error, and the frontend shows it greyed out.

**Act II — The Booking Shell.** Once the seat is locked, the user proceeds to payment. The frontend calls `POST /api/bookings` which creates a booking document with status `PENDING`. Crucially, **the seat stays LOCKED — it does not become BOOKED yet**. This is the single most important design decision in the whole system. If the seat went BOOKED here, a user who cancels at the payment step would leave a permanently dead seat.

**Act III — The Payment.** The frontend then calls `POST /api/payments/create-order` which asks Razorpay to create an order for the booking amount. Razorpay returns an `orderId`. The frontend opens the Razorpay Checkout modal with that order ID.

**Act IV — The Branch Point.** Now one of two things happens.

*If the user pays:* Razorpay hands back a `razorpay_payment_id` and a signature. The frontend calls `POST /api/payments/verify`, which recomputes the HMAC-SHA256 signature on the server and compares. If it matches, the server finally calls `bookSeat()` — the seat transitions `LOCKED → BOOKED`, the booking transitions `PENDING → CONFIRMED`, and the payment ID is stored. Only at this exact moment does the seat become permanently booked.

*If the user cancels* (closes the modal, hits back, or the tab crashes): Razorpay's `ondismiss` callback fires, the frontend calls `POST /api/bookings/{id}/cancel`, and the server **smart-releases** the seat — inspecting whether it's currently LOCKED or BOOKED and calling the right release path. The seat goes back to `AVAILABLE` immediately. The user can try again or pick a different seat.

**Act V — The Silent Janitor.** What if the user just closes their laptop and never comes back? The lock would sit there forever. Two mechanisms prevent this:

First, every read of seat availability calls a method called `getSeatMatrixWithExpiryCheck()` which, before returning the matrix, scans every lock and demotes any whose `expiresAt` is in the past. So the moment someone else looks at the seat map, the stale lock is silently released — no waiting for a scheduler.

Second, a scheduled job every 30 seconds does the same sweep across all cached matrices, catching locks that no one has looked at yet. If the process restarts, the lock data is in MongoDB and gets picked up on the next sweep.

**The Result.** Seat `C6` can be safely targeted by hundreds of users concurrently. Exactly one of them will succeed in locking it. Of those, exactly one will successfully pay. Everyone else sees clean, immediate feedback — "locked by someone else", "already booked", "your lock expired" — and can move on. The system self-heals from abandoned sessions without any manual intervention.

---

## ✨ Features

### 🔐 Authentication

**Email/password + Google OAuth** — the standard path uses BCrypt for password hashing and issues two JWTs on successful login: a short-lived access token (7 days) and a refresh token (30 days). The Google path is different — the frontend gets an ID token from Google's JavaScript SDK, sends it to `POST /api/auth/google`, and the server verifies the token's signature and audience against your Google Client ID. If valid, the server either creates a new user, or links the Google account to an existing email-based account. Users who signed up exclusively via Google are blocked from attempting a password login — they get a friendly message telling them to continue with Google.

**Password reset flow** — when a user forgets their password, they enter their email. The server generates 32 bytes of cryptographically secure random data, Base64-URL-encodes it, and emails the raw token in a styled HTML email. **The raw token is never stored** — only its SHA-256 hash is saved to MongoDB, along with a 15-minute expiry. When the user clicks the link, the frontend passes the token back, the server hashes it, looks up the hash, verifies expiry and single-use status, and updates the password. The endpoint always returns HTTP 200 regardless of whether the email exists, which prevents attackers from enumerating accounts.

### 🎟 Booking Engine

- **Concurrent seat locking** with 10-minute TTL and per-user tagging
- **Read-time lock expiry demotion** — stale locks release on the next availability read
- **Scheduled background sweep** every 30 seconds for locks nobody has read
- **Smart release on cancel** — handles both LOCKED and BOOKED seats correctly
- **Idempotent payment confirmation** — the verify endpoint is safe to call multiple times with the same payment ID
- **Razorpay HMAC-SHA256 signature verification** before any seat becomes BOOKED

### 🎨 Frontend Experience

- **Dark premium UI** with glass-morphism authentication screens and ambient gradient orbs
- **Live seat counts** on Home, EventsList, and EventDetail pages, polled from booking-service every 15 seconds (paused when tab is hidden)
- **Per-user favorites** with a custom window event for instant badge updates in the same tab and cross-tab sync via `storage`
- **Protected routes** with `state.from` so a user who tried to reach `/booking/xyz` while logged out is sent right back there after login
- **Framer Motion** micro-interactions on hover, mount, and dismiss
- **SyncBot** — AI chatbot with Gemini primary and rule-based fallback

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java | 21+ | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| Node.js | 18+ | `node -v` |
| MongoDB | Atlas free tier | https://cloud.mongodb.com |
| Razorpay | Test account | https://dashboard.razorpay.com |
| Gmail | App password | https://myaccount.google.com/apppasswords |

### 1. Clone

```bash
git clone https://github.com/Mohitt029/CinemaSync.git
cd CinemaSync
```

### 2. Create the secrets files

These are **all gitignored** — they never leave your machine.

**`backend/auth-service/secrets.env`**
```env
MAIL_USERNAME=your.email@gmail.com
MAIL_PASSWORD=your16charapppassword
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

**`backend/booking-service/secrets.env`**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:8081/api
REACT_APP_EVENT_API_URL=http://localhost:8082/api
REACT_APP_BOOKING_API_URL=http://localhost:8084/api
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### 3. Start the services

Open **four terminals** (one per service):

```bash
# Terminal 1 — Auth
cd backend/auth-service
mvn spring-boot:run

# Terminal 2 — Events
cd backend/event-service
mvn spring-boot:run

# Terminal 3 — Booking
cd backend/booking-service
mvn spring-boot:run

# Terminal 4 — Frontend
cd frontend
npm install
npm start
```

Wait for each terminal to print `Started ...Application in X seconds` before starting the next.

### 4. Open the app

🌐 **http://localhost:3000**

### 5. Test a real payment

Use Razorpay's **domestic** test card:

| Field | Value |
|-------|-------|
| Card number | `4386 2894 0766 0153` |
| Expiry | Any future date (e.g. `12/30`) |
| CVV | Any 3 digits (e.g. `123`) |
| OTP | `1234` |

> **Important:** `4111 1111 1111 1111` is classified as an **international** card by Razorpay India and will be rejected with "International cards not supported". Use the domestic test card above, or use UPI ID `success@razorpay` for an instant-success test.

Expected server logs on success:
```
POST /api/bookings                 → PENDING booking created
POST /api/payments/create-order    → Razorpay order_XXXX
POST /api/payments/verify          → signature verify: true
Booked: <seat> for booking <id>    → LOCKED → BOOKED
Booking confirmed: <id> paymentId=pay_XXXX
```

---

## 📸 Screenshots

> Add your own screenshots to `docs/screenshots/` and they'll render below.

<div align="center">

| Login | Events Grid |
|-------|-------------|
| ![login](./docs/screenshots/login.png) | ![events](./docs/screenshots/events.png) |

| Seat Map | Payment |
|----------|---------|
| ![seats](./docs/screenshots/seats.png) | ![payment](./docs/screenshots/payment.png) |

</div>

To create the folder:
```powershell
New-Item -ItemType Directory -Path "D:\CinemaSync\docs\screenshots" -Force
```
Then `Win + Shift + S` to screenshot the running app and save the four PNGs.

---

## 🧪 API Reference

### Auth Service (8081)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account (email + password) |
| POST | `/api/auth/login` | Get JWT via email + password |
| POST | `/api/auth/google` | Exchange Google ID token for JWT |
| POST | `/api/auth/forgot-password` | Request reset email |
| POST | `/api/auth/reset-password` | Complete reset with token |
| GET | `/api/auth/me` | Current user profile |

### Event Service (8082)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/events` | Paginated list |
| GET | `/api/events/{id}` | Single event with showtimes |
| GET | `/api/events/search?keyword=...` | Simple keyword search |
| GET | `/api/events/search/advanced` | Geo + filters (category, language, format, time) |
| POST | `/api/chat` | AI chatbot (Gemini + rule fallback) |

### Booking Service (8084)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/seats/lock` | Lock one or more seats (10-min TTL) |
| DELETE | `/api/seats/lock/{showId}/{seatId}` | Manually release a lock |
| GET | `/api/seats/show/{showId}/availability` | Live seat matrix |
| POST | `/api/bookings` | Create PENDING booking |
| GET | `/api/bookings/{id}` | Fetch booking |
| PUT | `/api/bookings/{id}/cancel` | Cancel booking (releases seat) |
| POST | `/api/bookings/{id}/cancel` | Same, called by Razorpay dismiss |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify signature + confirm booking |
| GET | `/api/payments/status` | Is Razorpay configured? |

---

## 🛠 Tech Stack

**Backend:** Spring Boot 3.2 · Spring Security · Spring Data MongoDB · JJWT · Razorpay Java SDK · Google API Client · JavaMailSender · Lombok

**Frontend:** React 18 · TypeScript · Material UI 5 · Redux Toolkit · React Router 6 · Formik · Yup · Framer Motion · Axios · React Hot Toast

**Infra:** MongoDB Atlas · Razorpay · Google Identity Services · Gmail SMTP

---

## 📁 Project Structure

```
CinemaSync/
├── backend/
│   ├── auth-service/          # JWT + Google OAuth + password reset
│   │   ├── src/main/java/com/cinemasync/auth/
│   │   │   ├── controller/    # AuthController
│   │   │   ├── service/       # AuthService, JwtService, GoogleAuthService, PasswordResetService
│   │   │   ├── model/         # User, PasswordResetToken
│   │   │   ├── filter/        # JwtAuthenticationFilter
│   │   │   └── config/        # SecurityConfig, MongoConfig
│   │   └── secrets.env        # gitignored
│   │
│   ├── event-service/         # Events + AI chatbot
│   │   ├── src/main/java/com/cinemasync/event/
│   │   │   ├── controller/    # EventController, ChatController
│   │   │   ├── service/       # EventService
│   │   │   └── model/         # Event, Showtime
│   │   └── .env               # gitignored
│   │
│   └── booking-service/       # Seats + Razorpay + bookings
│       ├── src/main/java/com/cinemasync/booking/
│       │   ├── controller/    # BookingController, SeatController, PaymentController
│       │   ├── service/       # BookingService, SeatAllocationService, RazorpayService
│       │   ├── model/         # Booking, SeatMatrix, Coupon
│       │   ├── scheduler/     # ExpiryScheduler
│       │   └── config/        # CorsConfig, SchedulingConfig
│       └── secrets.env        # gitignored
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # GoogleSignInButton
│   │   │   ├── booking/       # SeatMap, PaymentStep
│   │   │   ├── events/        # EventCard
│   │   │   ├── layout/        # Layout, Footer
│   │   │   └── chat/          # ChatBot
│   │   ├── hooks/             # useAuth, useEvents, useBooking, useLiveSeats
│   │   ├── pages/             # Login, Register, Events, EventDetail, Booking…
│   │   ├── services/          # auth, event, booking, payment, availability, favorites
│   │   ├── store/slices/      # auth.slice, event.slice
│   │   └── types/             # TypeScript interfaces
│   └── .env                   # gitignored
│
└── README.md
```

---

## 🔒 Security Notes

- Passwords hashed with **BCrypt** (cost factor 10)
- Password reset tokens stored as **SHA-256 hashes** only
- JWT signed with **HMAC-SHA256** using a Base64-encoded secret
- Google ID tokens verified **server-side** with audience check
- Razorpay signatures verified with **HMAC-SHA256** before confirming any booking
- All secrets live in **gitignored** `secrets.env` files
- CORS restricted to trusted origins in production
- Endpoints always return HTTP 200 for forgot-password, preventing account enumeration

**Never commit:**
- `secrets.env`, `.env`
- `*.pem`, `*.key`
- `application-local.yml`

---

## 🧠 Engineering Highlights

**1. Idempotent booking confirmation.** Calling `/api/payments/verify` twice with the same payment ID does not error — the second call returns the already-confirmed booking. This makes the endpoint safe to retry from flaky networks.

**2. Read-time lock expiry demotion.** Instead of relying solely on a 30-second scheduler, every read of seat availability demotes expired locks to AVAILABLE on the spot. This closes the window where a user could see a stale "LOCKED" seat after the TTL passed.

**3. Smart seat release on cancel.** When a booking is cancelled, the server doesn't blindly assume the seat is LOCKED — it inspects the current state and routes to the correct release path. This handles the tricky case where a seat was already booked and needs to be freed, not just unlocked.

**4. Cross-tab favorites sync.** The favorites service dispatches a custom `cinemasync:favorites-changed` window event on every mutation, letting the header badge update instantly in the same tab, while standard `storage` events keep other tabs in sync.

**5. Live availability without stale denormalization.** Instead of trusting an `availableSeats` field stored on the event document (which goes stale the moment someone books), the frontend polls booking-service directly for the current matrix state — so what users see on the event card matches reality, always.

---

## 🗺 Roadmap

- [x] JWT authentication + Google OAuth
- [x] Email-based password reset
- [x] Event CRUD with showtimes
- [x] Concurrent seat locking with TTL
- [x] Razorpay integration with signature verification
- [x] AI chatbot (Gemini + rule fallback)
- [x] Live availability polling
- [x] Per-user favorites with cross-tab sync
- [ ] Admin dashboard (users, bookings, refunds)
- [ ] Webhook handling for Razorpay server-side events
- [ ] WebSocket-based live seat updates (replace polling)
- [ ] WhatsApp / SMS booking confirmations
- [ ] Docker Compose for one-command startup
- [ ] CI/CD via GitHub Actions
- [ ] Production deployment (Railway + Vercel)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

Commit convention: `feat:` `fix:` `docs:` `refactor:` `test:` `chore:`

---

## 📄 License

MIT License — see [LICENSE](./LICENSE)

---

<div align="center">

### Built with ❤️ by [Mohit](https://github.com/Mohitt029)

<a href="https://github.com/Mohitt029/CinemaSync">
  <img src="https://img.shields.io/github/stars/Mohitt029/CinemaSync?style=social" />
</a>
<a href="https://github.com/Mohitt029/CinemaSync/issues">
  <img src="https://img.shields.io/github/issues/Mohitt029/CinemaSync" />
</a>

*If this project helped you, consider giving it a ⭐*

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=120&section=footer" width="100%" />

</div>
