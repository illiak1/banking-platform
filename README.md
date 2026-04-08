# 💳 Mini Banking App

A fullstack banking application built with **React + NestJS + Prisma + PostgreSQL**.

---

## 🚀 Features

* 🔐 User authentication (register & login with JWT)
* 👤 User dashboard
* 💰 Account balance display
* 📊 Transaction history
* 🧾 Secure backend with guards
* 🗄️ Prisma ORM + PostgreSQL

---

## 🏗️ Project Structure

```
mini-banking/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── AccountCard.tsx
│   │   │   └── TransactionTable.tsx
│   │   ├── pages/
│   │   │   ├── Register.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── Login.module.css
│   │   │   └── Dashboard.module.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── transactions/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/mini-banking.git
cd mini-banking
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create `.env` file:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/dbname
JWT_SECRET=your_secret_key
```

Run Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

Start backend:

```bash
npm run start:dev
```

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm start
```

---

## 🌐 API Endpoints

### Auth

* `POST /auth/register`
* `POST /auth/login`

### Users

* `GET /users/dashboard`

### Transactions

* `GET /transactions`

---

## 🔐 Authentication

* JWT-based authentication
* Token stored in `localStorage`
* Protected routes via guards

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Axios
* **Backend:** NestJS
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Auth:** JWT

---

## 📌 Future Improvements

* Add money transfer feature
* Add account creation
* Improve UI/UX
* Add tests

---

## 👨‍💻 Author

Illia Karban
