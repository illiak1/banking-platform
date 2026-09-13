import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/axiosInstance';
import AccountCard from '../components/AccountCard';
import ConfirmModal from '../components/ConfirmModal';
import TransactionTable, { Transaction } from '../components/TransactionTable';
import { useToast } from '../context/ToastContext';
import { RealtimeTransaction, useTransactionUpdates } from '../hooks/useTransactionUpdates';
import styles from '../styles/Dashboard.module.css';

interface User {
  email: string;
  createdAt: string;
  balance: string;
}

interface TransferFieldErrors {
  toEmail?: string;
  amount?: string;
}

interface RecipientCheck {
  status: 'idle' | 'checking' | 'ok' | 'not_found' | 'self';
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  counterparty: string;
}

const EMPTY_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  counterparty: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TRANSFER_AMOUNT = 1_000_000;
const RECIPIENT_CHECK_DEBOUNCE_MS = 400;

function validateTransfer(toEmail: string, amount: string): TransferFieldErrors {
  const errors: TransferFieldErrors = {};

  if (!toEmail) {
    errors.toEmail = 'Recipient email is required';
  } else if (!EMAIL_PATTERN.test(toEmail)) {
    errors.toEmail = 'Enter a valid email address';
  }

  const parsedAmount = Number(amount);
  if (!amount) {
    errors.amount = 'Amount is required';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Amount must be greater than zero';
  } else if (parsedAmount > MAX_TRANSFER_AMOUNT) {
    errors.amount = `Amount exceeds the ${MAX_TRANSFER_AMOUNT.toLocaleString()} transfer limit`;
  }

  return errors;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadError, setLoadError] = useState('');

  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TransferFieldErrors>({});
  const [recipientCheck, setRecipientCheck] = useState<RecipientCheck>({
    status: 'idle',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userRes = await api.get('/users/dashboard');
      setUser(userRes.data);

      const txRes = await api.get('/transactions');
      setTransactions(txRes.data);
      setLoadError('');
    } catch (err: any) {
      // 401/403 is handled centrally by the axios interceptor, which clears the
      // token and redirects, so only real errors need surfacing here.
      const status = err?.response?.status;
      if (status !== 401 && status !== 403) {
        const message = apiErrorMessage(err, 'Could not load your dashboard');
        setLoadError(message);
        toast.error(message);
      }
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pushed by TransactionsGateway the instant a transfer involving this user
  // commits — this is what makes the recipient's list update without them
  // doing anything. Always refetch (cheap, idempotent, and keeps a second
  // open tab honest too), but only toast for money arriving: the sender
  // already got a toast directly from confirmTransfer's own response, so
  // toasting their own OUT event again here would just be a duplicate.
  const handleRealtimeTransaction = useCallback(
    (tx: RealtimeTransaction) => {
      if (tx.direction === 'IN') {
        toast.info(`💰 Received $${tx.amount.toFixed(2)} from ${tx.counterpartyEmail}`);
      }
      fetchData();
    },
    [fetchData, toast],
  );

  const { connected: liveUpdatesConnected } = useTransactionUpdates(handleRealtimeTransaction);

  // Checks whether the typed recipient exists, debounced so it fires once
  // the user pauses rather than on every keystroke. This only ever tells the
  // form "found" / "not found" / "that's you" — see the backend endpoint's
  // own comment for why it stays that minimal.
  useEffect(() => {
    if (!EMAIL_PATTERN.test(toEmail)) {
      setRecipientCheck({ status: 'idle' });
      return;
    }

    setRecipientCheck({ status: 'checking' });
    let cancelled = false;

    const handle = setTimeout(async () => {
      try {
        const res = await api.get('/users/search', { params: { email: toEmail } });
        if (cancelled) return;
        if (res.data.isSelf) setRecipientCheck({ status: 'self' });
        else if (res.data.exists) setRecipientCheck({ status: 'ok' });
        else setRecipientCheck({ status: 'not_found' });
      } catch {
        if (!cancelled) setRecipientCheck({ status: 'idle' });
      }
    }, RECIPIENT_CHECK_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [toEmail]);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateTransfer(toEmail, amount);
    if (recipientCheck.status === 'not_found') {
      errors.toEmail = 'No account is registered with this email';
    } else if (recipientCheck.status === 'self') {
      errors.toEmail = 'You cannot transfer to your own account';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // The transfer itself only happens after the user confirms in the modal —
    // there is no undo once the request reaches the server.
    setShowConfirm(true);
  };

  const confirmTransfer = async () => {
    setSending(true);
    try {
      await api.post('/transactions/transfer', {
        toEmail,
        amount: Number(amount),
      });

      toast.success(`Sent $${Number(amount).toFixed(2)} to ${toEmail}`);
      setToEmail('');
      setAmount('');
      setFieldErrors({});
      setRecipientCheck({ status: 'idle' });
      setShowConfirm(false);

      await fetchData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Transfer failed');
      toast.error(message);
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.dateFrom && new Date(tx.createdAt) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(tx.createdAt) > endOfDay) return false;
      }
      if (filters.minAmount && tx.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount && tx.amount > Number(filters.maxAmount)) return false;
      if (
        filters.counterparty &&
        !tx.counterpartyEmail.toLowerCase().includes(filters.counterparty.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  if (!user) {
    return <p className={styles.emptyState}>{loadError || 'Loading...'}</p>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h2>Welcome, {user.email}</h2>
        <span
          className={`${styles.liveIndicator} ${liveUpdatesConnected ? styles.liveOn : styles.liveOff}`}
          title={
            liveUpdatesConnected
              ? 'Live updates connected'
              : 'Live updates unavailable — reconnecting'
          }
        >
          <span className={styles.liveDot} />
          {liveUpdatesConnected ? 'Live' : 'Connecting…'}
        </span>
      </header>

      <div className={styles.cardsGrid}>
        <AccountCard
          userEmail={user.email}
          createdAt={user.createdAt}
          balance={`$${Number(user.balance).toFixed(2)}`}
        />
      </div>

      <section className={styles.transferSection}>
        <h3>Transfer Money</h3>

        <form className={styles.transferForm} onSubmit={handleTransferSubmit} noValidate>
          <div className={styles.field}>
            <input
              type="email"
              placeholder="Recipient Email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className={`${styles.input} ${fieldErrors.toEmail ? styles.inputError : ''}`}
              aria-invalid={Boolean(fieldErrors.toEmail)}
            />
            {fieldErrors.toEmail ? (
              <span className={styles.fieldError}>{fieldErrors.toEmail}</span>
            ) : (
              <>
                {recipientCheck.status === 'checking' && (
                  <span
                    className={`${styles.recipientHint} ${styles.recipientHintChecking}`}
                  >
                    Checking…
                  </span>
                )}
                {recipientCheck.status === 'ok' && (
                  <span className={`${styles.recipientHint} ${styles.recipientHintOk}`}>
                    ✓ Recipient found
                  </span>
                )}
                {recipientCheck.status === 'not_found' && (
                  <span className={`${styles.recipientHint} ${styles.recipientHintBad}`}>
                    No account with this email
                  </span>
                )}
                {recipientCheck.status === 'self' && (
                  <span className={`${styles.recipientHint} ${styles.recipientHintBad}`}>
                    That’s your own account
                  </span>
                )}
              </>
            )}
          </div>

          <div className={styles.field}>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${styles.input} ${fieldErrors.amount ? styles.inputError : ''}`}
              min="0.01"
              step="0.01"
              aria-invalid={Boolean(fieldErrors.amount)}
            />
            {fieldErrors.amount && (
              <span className={styles.fieldError}>{fieldErrors.amount}</span>
            )}
          </div>

          <button type="submit" className={styles.sendBtn}>
            Send Money
          </button>
        </form>
      </section>

      <section className={styles.transactionsSection}>
        <div className={styles.transactionsHeader}>
          <h3>Recent Transactions</h3>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? 'Hide filters' : 'Filter'}
            {hasActiveFilters ? ' •' : ''}
          </button>
        </div>

        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterField}>
              <label htmlFor="filter-date-from">From</label>
              <input
                id="filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="filter-date-to">To</label>
              <input
                id="filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="filter-min-amount">Min amount</label>
              <input
                id="filter-min-amount"
                type="number"
                min="0"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilter('minAmount', e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="filter-max-amount">Max amount</label>
              <input
                id="filter-max-amount"
                type="number"
                min="0"
                placeholder="Any"
                value={filters.maxAmount}
                onChange={(e) => setFilter('maxAmount', e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="filter-counterparty">Recipient / sender</label>
              <input
                id="filter-counterparty"
                type="text"
                placeholder="email contains…"
                value={filters.counterparty}
                onChange={(e) => setFilter('counterparty', e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <div className={styles.filtersActions}>
                <button
                  type="button"
                  className={styles.clearFiltersBtn}
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        <TransactionTable
          transactions={filteredTransactions}
          emptyMessage={
            hasActiveFilters
              ? 'No transactions match these filters.'
              : 'No transactions yet.'
          }
        />
      </section>

      {showConfirm && (
        <ConfirmModal
          title="Confirm transfer"
          message={
            <>
              Send <strong>${Number(amount).toFixed(2)}</strong> to{' '}
              <strong>{toEmail}</strong>? This cannot be undone.
            </>
          }
          confirmLabel="Send money"
          busy={sending}
          onConfirm={confirmTransfer}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
