# 💳 Banking Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)

A full-stack banking demo: register, log in, transfer money to other users by email, and watch your
balance and transaction history update **live** — no refresh — the instant money moves, thanks to a
WebSocket layer sitting alongside the REST API. Built with **React, NestJS, Prisma, PostgreSQL, and
Socket.IO**.

---

## 🎬 See It in Action

![Login Page](./screenshots/login.png)
*Login — clean, centered form with inline validation.*

![Dashboard](./screenshots/dashboard.png)
*Dashboard — balance front and center, a live-connection indicator for the WebSocket feed, and a
real transfer/history feed for a seeded account.*

![Real-time transfer](./screenshots/transfer-realtime.png)
*Real-time transfer: Alice sends $50 to Bob, Bob receives it instantly without refresh — two separate
logged-in sessions, side by side, captured at the moment the transfer commits.*

![Transactions](./screenshots/transactions.png)
*Transaction history — filterable by date range, amount range, and counterparty (filtered to "bob" here).*

![Profile](./screenshots/profile.png)
*Profile — email, member-since date, account ID, and balance at a glance.*

---

## ✨ Features

**Authentication & security**
- Register / login with JWT (bcrypt-hashed passwords, `HS256`-pinned tokens)
- Server-side password policy (8+ characters, upper/lower case, a number, a symbol)
- Request validation on every endpoint (`class-validator` + a global `ValidationPipe`) with clear,
  per-field error messages
- Rate limiting on auth endpoints (5 attempts/minute) to blunt credential-stuffing and brute force
- Consistent JSON error responses for every failure — validation, not-found, conflict, or unexpected

**Accounts & transfers**
- Automatic account on registration
- Transfer to any user by email, with a confirmation step before anything moves
- Live recipient lookup — the transfer form tells you before you submit whether that email exists
- Race-safe balance updates: the funds check is the write itself (a guarded `UPDATE`), not a prior read,
  so two simultaneous transfers can't both succeed and overdraw an account — backed by a database `CHECK`
  constraint as a second line of defense
- Full transaction history, filterable by date range, amount range, and counterparty

**Real-time updates**
- A WebSocket push (Socket.IO) fires the instant a transfer commits, to both the sender and the recipient
- Authenticated at the socket level with the same JWT the REST API uses
- The dashboard shows a live connection indicator and updates without a manual refresh

**Everything else**
- Profile page (email, member-since date, account ID, balance)
- Toast notifications and inline field validation throughout
- Confirmation modal before any transfer
- Responsive layout down to phone width
- Seed script for instant demo data

---

## 🛠️ Tech Stack

| | |
|---|---|
| **Frontend** | React 18 (TypeScript), React Router, Axios, Socket.IO Client, CSS Modules |
| **Backend** | NestJS 11, Prisma ORM, PostgreSQL, class-validator, `@nestjs/throttler`, Socket.IO |
| **Auth** | JSON Web Tokens (`jsonwebtoken`), bcrypt |
| **Real-time** | `@nestjs/websockets` + `@nestjs/platform-socket.io` (server), `socket.io-client` (client) |
| **Tooling** | ESLint, Prettier, Jest, Docker Compose |

---

## 📁 Project Structure

```
mini-banking/
├── backend/
│   ├── src/
│   │   ├── auth/                  # register/login, JWT guard, rate limiting
│   │   ├── users/                 # dashboard + recipient search
│   │   ├── transactions/          # transfer logic, WebSocket gateway
│   │   ├── common/
│   │   │   ├── dto/               # class-validator request DTOs
│   │   │   └── filters/           # global exception → JSON mapping
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts                # demo users + sample transfers
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/axiosInstance.ts   # shared HTTP client
│   │   ├── hooks/                 # useTransactionUpdates (WebSocket)
│   │   ├── context/               # toast notifications
│   │   ├── components/            # Navbar, AccountCard, TransactionTable, ConfirmModal
│   │   ├── pages/                 # Login, Register, Dashboard, Profile
│   │   ├── styles/                # CSS Modules
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml              # Postgres + Redis (infrastructure only)
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ and npm
- [Docker](https://www.docker.com/) (recommended, for Postgres), **or** a local PostgreSQL install

### 1. Clone the repository

```bash
git clone https://github.com/illiak1/mini-banking.git
cd mini-banking
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This starts Postgres on `localhost:5432` (user/password `postgres`, database `minibank`, created
automatically). A Redis container also starts but isn't used by the app yet — it's there for future work.

> Already have Postgres running locally on port 5432 (e.g. a native install)? Stop it first, or it will
> silently intercept the connection instead of the Docker container — you'll get an authentication error
> that has nothing to do with your actual `.env` password.

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

`backend/.env` needs at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/minibank"
JWT_SECRET=some_long_random_string
```

Generate a secret if you don't have one handy:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Apply the schema and load demo data:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the API:

```bash
npm run start:dev
```

The backend listens on `http://localhost:3000` (both REST and the WebSocket gateway, on the same port).

### 4. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env    # optional — defaults already point at localhost:3000
npm start
```

The backend takes port 3000, so CRA will offer to run on **3001** — accept that. The dev server opens at
`http://localhost:3001`.

---

## 🚀 Usage

### Log in with a seeded account

`npx prisma db seed` creates five demo users, all sharing the same password:

| Email | Password |
|---|---|
| `alice@example.com` | `Demo1234!` |
| `bob@example.com` | `Demo1234!` |
| `carol@example.com` | `Demo1234!` |
| `dave@example.com` | `Demo1234!` |
| `erin@example.com` | `Demo1234!` |

Log in as any of them at `http://localhost:3001/login`.

### See it update in real time

1. Log in as **Alice** in one browser window.
2. Log in as **Bob** in another (use an incognito/private window so the two sessions don't share
   `localStorage`).
3. From Alice's dashboard, send Bob some money.
4. Watch Bob's transaction list and balance update **immediately**, with no refresh — pushed over the
   WebSocket connection the moment the transfer commits.

### Try the API directly

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Str0ng!Pass"}'

# Log in
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Demo1234!"}'
# → { "message": "Login successful", "token": "..." }

# Send money (replace TOKEN with the token above)
curl -X POST http://localhost:3000/transactions/transfer \
  -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
  -d '{"toEmail":"bob@example.com","amount":25.50}'
```

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create an account (rate limited) |
| `POST` | `/auth/login` | — | Get a JWT (rate limited) |
| `GET` | `/users/dashboard` | ✅ | Email, balance, account ID, member-since date |
| `GET` | `/users/search?email=` | ✅ | Check whether a recipient exists, before transferring |
| `GET` | `/transactions` | ✅ | Transaction history — direction and counterparty email included |
| `POST` | `/transactions/transfer` | ✅ | Send money to another user by email |

Protected routes need `Authorization: Bearer <token>`. Every response — success or failure — is JSON;
validation failures return a `400` with an `errors` array describing what to fix.

**WebSocket**: connect to the same origin with a `transaction` event listener; authenticate by passing
`{ auth: { token } }` when opening the socket. See `frontend/src/hooks/useTransactionUpdates.ts` for a
complete client example.

---

## 🧪 Testing

```bash
cd backend
npm test                  # unit tests
RUN_DB_TESTS=1 npm test   # also runs a concurrency test against a real Postgres instance,
                           # proving two simultaneous transfers can't overdraw an account
```

---

## 🧭 What's Next

- [ ] Multiple accounts per user (checking / savings)
- [ ] Spending analytics and charts
- [ ] Dark mode
- [ ] Email verification and two-factor authentication
- [ ] WebSocket re-authentication on token expiry (currently checked once, at connect time)
- [ ] `Decimal`/integer-minor-units money storage instead of `Float`
- [ ] CI pipeline (lint + test on every PR)
- [ ] Containerized app services in `docker-compose.yml` (currently infrastructure-only)

---

## 👨‍💻 Author

**Illia Karban**
GitHub: [@illiak1](https://github.com/illiak1)
