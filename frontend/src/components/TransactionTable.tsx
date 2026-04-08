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
    <div className={styles.txContainer}>
  {transactions.map((tx) => (
    <div key={tx.id} className={styles.txRow}>
      <div className={styles.txLeft}>
        <div className={styles.txTitle}>
          {tx.type === 'OUT' ? '⬆️ Sent' : '⬇️ Received'}
        </div>
        <div className={styles.txDate}>{tx.date}</div>
      </div>

      <div className={styles.txRight}>
        <div
          className={
            tx.type === 'OUT'
              ? styles.txAmountOut
              : styles.txAmountIn
          }
        >
          {tx.type === 'OUT' ? `- $${tx.amount}` : `+ $${tx.amount}`}
        </div>

        <div
          className={
            tx.type === 'OUT'
              ? styles.txBadgeOut
              : styles.txBadgeIn
          }
        >
          {tx.type}
        </div>
      </div>
    </div>
  ))}
</div>
  );
};

export default TransactionTable;