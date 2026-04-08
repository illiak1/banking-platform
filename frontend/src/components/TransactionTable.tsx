// src/components/TransactionTable.tsx
import React from 'react';
import styles from '../styles/Dashboard.module.css';

interface Transaction {
  id: number;
  date: string;
  amount: string;
  type: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  return (
    <table className={styles.table}>
  <thead>
    <tr>
      <th>ID</th>
      <th>Date</th>
      <th>Amount</th>
      <th>Type</th>
    </tr>
  </thead>
  <tbody>
    {transactions.map((tx) => (
      <tr key={tx.id}>
        <td>{tx.id}</td>
        <td>{tx.date}</td>
        <td
          className={
            tx.type === 'OUT'
              ? styles.outAmount
              : styles.inAmount
          }
        >
          {tx.type === 'OUT' ? `- $${tx.amount}` : `+ $${tx.amount}`}
        </td>
        <td>
          <span
            className={
              tx.type === 'OUT'
                ? styles.outBadge
                : styles.inBadge
            }
          >
            {tx.type}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
  );
};

export default TransactionTable;