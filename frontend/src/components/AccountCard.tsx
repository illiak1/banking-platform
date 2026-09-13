import React from 'react';
import styles from '../styles/Dashboard.module.css';

interface AccountCardProps {
  userEmail: string;
  createdAt: string;
  balance: string;
}

const AccountCard: React.FC<AccountCardProps> = ({ userEmail, createdAt, balance }) => {
  return (
    <div className={styles.card}>
      <h3>Available Balance</h3>
      <p className={styles.cardBalance}>{balance}</p>
      <div className={styles.cardMeta}>
        <span>{userEmail}</span>
        <span>
          Member since{' '}
          {new Date(createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
};

export default AccountCard;
