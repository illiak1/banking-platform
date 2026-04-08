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
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');

  const navigate = useNavigate();

  
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
      const formattedTransactions = txRes.data.map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.createdAt).toLocaleString(),
        amount: `${tx.amount}`,
        type: tx.fromId === tx.toId ? 'SELF' : tx.fromId ? 'OUT' : 'IN',
      }));

      setTransactions(formattedTransactions);
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Something went wrong');
      }
    }
  };

  // ✅ Load on mount
  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Transfer money
  const handleTransfer = async () => {
    const token = localStorage.getItem('token');

    if (!toEmail || !amount) {
      alert('Please fill all fields');
      return;
    }

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

      // clear inputs
      setToEmail('');
      setAmount('');

      // refresh data
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Transfer failed');
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h2>Welcome, {user.email}</h2>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </header>

      <div className={styles.cardsGrid}>
        <AccountCard
          userEmail={user.email}
          createdAt={user.createdAt}
          balance={`${Number(user.balance).toFixed(2)} USD`}
        />
      </div>

      {/* 💸 Transfer Section */}
      <section style={{ marginTop: '20px' }}>
        <h3>Transfer Money</h3>

        <input
          type="email"
          placeholder="Recipient Email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button onClick={handleTransfer}>Send</button>
      </section>

      {/* 📊 Transactions */}
      <section className={styles.transactionsSection}>
        <h3>Recent Transactions</h3>
        <TransactionTable transactions={transactions} />
      </section>
    </div>
  );
};

export default DashboardPage;