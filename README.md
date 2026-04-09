# 💳 Mini Banking App

A full-stack mini banking application built with **React, NestJS, Prisma, and PostgreSQL**.

Users can register, log in, view account details, transfer money, and track transaction history in a modern dashboard.

---

## 🚀 Features

### 🔐 Authentication

* User registration
* Secure login with JWT
* Protected routes

### 🏦 Account System

* Automatic account creation on registration
* Balance tracking
* Account overview dashboard

### 💸 Transactions

* Send money to other users via email
* Real-time balance updates
* Transaction history (IN / OUT)

### 📊 Dashboard UI

* Clean fintech-style interface (inspired by modern banking apps)
* Styled transaction list
* Responsive layout

---

## 🛠️ Tech Stack

### Frontend

* React (TypeScript)
* React Router
* Axios
* CSS Modules

### Backend

* NestJS
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Bcrypt (password hashing)

---

## 📁 Project Structure

```
mini-banking/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountCard.tsx
│   │   │   └── TransactionTable.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── Dashboard.module.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── transactions/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── package.json
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/illiak1/mini-banking.git
cd mini-banking
```

---

### 2️⃣ Backend setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mini_banking"
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

### 3️⃣ Frontend setup

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
* `POST /transactions/transfer`

---

## 🔐 Environment Variables

Create `.env` in backend:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```

---

## 📸 Screenshots 

Login
![Login Page](screenshots/LoginPage.png)


Registration
![Registration Page](screenshots/RegisterPage.png)


Dashboard
![Dashboard Page](screenshots/DashboardPage.png)

---

## 🧠 Future Improvements

* 💳 Multiple accounts (Savings / Checking)
* 📈 Charts (spending analytics)
* 🔎 Transaction search & filters
* 🌙 Dark mode
* 📱 Mobile optimization
* 🔔 Notifications

---

## 👨‍💻 Author

Illia Karban
GitHub: https://github.com/illiak1

---

## ⭐️ Show your support

If you like this project, give it a ⭐ on GitHub!
