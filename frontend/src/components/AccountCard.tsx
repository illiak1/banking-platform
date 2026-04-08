interface AccountCardProps {
  userEmail: string;
  createdAt: string;
  balance?: string; // optional, or remove ? if always required
}

const AccountCard: React.FC<AccountCardProps> = ({ userEmail, createdAt, balance }) => {
  return (
    <div className="card">
      <h3>Account Info</h3>
      <p>Email: {userEmail}</p>
      <p>Created: {createdAt}</p>
      {balance && <p>Balance: {balance}</p>}
    </div>
  );
};

export default AccountCard;