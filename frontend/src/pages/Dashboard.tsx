// frontend/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AccountCard from '../components/AccountCard';
import TransactionTable from '../components/TransactionTable';
import styles from '../styles/Dashboard.module.css';

interface User {
  email: string;
  createdAt: string;
  balance: string;
}

interface Transaction {
  id: number;
  date: string;
  amount: string;
  type: string;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userRes = await axios.get('http://localhost:3000/users/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      const txRes = await axios.get('http://localhost:3000/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(txRes.data);
    } catch (err: any) {
  console.error(err);

  if (err.response?.status === 401 || err.response?.status === 403) {
    navigate('/login');
  } else {
    alert(err.response?.data?.message || 'Something went wrong');
  }
}
  };

  fetchData();
}, [navigate]);

const handleTransfer = async () => {
  const token = localStorage.getItem('token');

  try {
    await axios.post(
      'http://localhost:3000/transactions/transfer',
      {
        toEmail,
        amount: Number(amount),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert('Transfer successful');
    window.location.reload(); // quick refresh
  } catch (err: any) {
    alert(err.response?.data?.message || 'Transfer failed');
  }
};

  const handleLogout = () => {
    navigate('/login');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h2>Welcome, {user.email}</h2>
        <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
      </header>

      <div className={styles.cardsGrid}>
        <AccountCard
          userEmail={user.email}
          createdAt={user.createdAt}
          balance={`${user.balance} USD`}
        />
      </div>

      <section style={{ marginTop: '20px' }}>
  <h3>Transfer Money</h3>

  <input
    type="email"
    placeholder="Recipient Email"
    value={toEmail}
    onChange={e => setToEmail(e.target.value)}
  />

  <input
    type="number"
    placeholder="Amount"
    value={amount}
    onChange={e => setAmount(e.target.value)}
  />

  <button onClick={handleTransfer}>Send</button>
</section>

      <section className={styles.transactionsSection}>
        <h3>Recent Transactions</h3>
        <TransactionTable transactions={transactions} />
      </section>
    </div>
  );
};

export default DashboardPage;