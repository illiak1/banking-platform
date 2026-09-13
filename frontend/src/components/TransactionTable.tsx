// src/components/TransactionTable.tsx
import React from 'react';
import styles from '../styles/Dashboard.module.css';

export interface Transaction {
  id: number;
  createdAt: string;
  amount: number;
  direction: 'IN' | 'OUT';
  counterpartyEmail: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  /** Shown when transactions is empty — different copy for "no history" vs "no matches". */
  emptyMessage?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  emptyMessage = 'No transactions yet.',
}) => {
  if (transactions.length === 0) {
    return <p className={styles.emptyState}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.txContainer}>
      {transactions.map((tx) => (
        <div key={tx.id} className={styles.txRow}>
          <div className={styles.txLeft}>
            <div className={styles.txTitle}>
              {tx.direction === 'OUT' ? '⬆️ Sent to' : '⬇️ Received from'}{' '}
              <span className={styles.txCounterparty}>{tx.counterpartyEmail}</span>
            </div>
            <div className={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</div>
          </div>

          <div className={styles.txRight}>
            <div
              className={tx.direction === 'OUT' ? styles.txAmountOut : styles.txAmountIn}
            >
              {tx.direction === 'OUT' ? '-' : '+'} ${tx.amount.toFixed(2)}
            </div>

            <div
              className={tx.direction === 'OUT' ? styles.txBadgeOut : styles.txBadgeIn}
            >
              {tx.direction}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionTable;
