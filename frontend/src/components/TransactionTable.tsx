// src/components/TransactionTable.tsx
import React from 'react';

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
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(transaction => (
          <tr key={transaction.id}>
            <td>{transaction.id}</td>
            <td>{transaction.date}</td>
            <td>{transaction.amount}</td>
            <td>{transaction.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TransactionTable;