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


### Service responsibilities

| Service | Port | Owns | Key endpoints |
|---------|------|------|---------------|
| **auth-service** | 8081 | Users, sessions, OAuth | `/api/auth/register`, `/login`, `/google`, `/forgot-password`, `/reset-password` |
| **event-service** | 8082 | Events, showtimes, chat | `/api/events`, `/search/advanced`, `/api/chat` |
| **booking-service** | 8084 | Seats, bookings, payments | `/api/seats/*`, `/api/bookings/*`, `/api/payments/*` |

---

### 🔐 Authentication
<table>
<tr>
<td width="50%">

**Email/password + Google OAuth**
- BCrypt password hashing
- JWT (7-day) + refresh token (30-day)
- Google ID-token verification server-side
- Auto-link Google account to existing email
- Blocks password login for Google-only users

</td>
<td width="50%">

**Password reset flow**
- 32-byte cryptographically random token
- **SHA-256 hash stored** (raw token only in email)
- 15-minute expiry, single-use
- Beautiful HTML email via Gmail SMTP
- Anti-enumeration (always returns 200)

</td>
</tr>
</table>

### 🎟 Booking engine

### 🎨 Frontend experience

- **Dark premium UI** with glass-morphism auth screens
- **Live seat counts** across Home / EventsList / EventDetail (polls booking-service every 15s)
- **Per-user favorites** (scoped localStorage + cross-tab sync)
- **Protected routes** with post-login redirect
- **Framer Motion** micro-interactions everywhere
- **SyncBot** — AI chatbot (Gemini + rule-based fallback)

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Java | 21+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| MongoDB | Atlas account (free tier) |
| Razorpay | Test account |
| Gmail | App password for SMTP |

### 1️⃣ Clone

```bash
git clone https://github.com/Mohitt029/CinemaSync.git
cd CinemaSync
