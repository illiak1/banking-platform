import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import styles from '../styles/Profile.module.css';

interface ProfileData {
  email: string;
  createdAt: string;
  balance: string;
  accountId: number;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    api
      .get('/users/dashboard')
      .then((res) => {
        if (!cancelled) setProfile(res.data);
      })
      .catch((err) => {
        // 401/403 is handled by the axios interceptor (clears token, redirects).
        const status = err?.response?.status;
        if (!cancelled && status !== 401 && status !== 403) {
          const message = apiErrorMessage(err, 'Could not load your profile');
          setError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  if (loading) return <p className={styles.status}>Loading profile…</p>;
  if (error) return <p className={`${styles.status} ${styles.errorText}`}>{error}</p>;
  if (!profile) return null;

  const memberSince = new Date(profile.createdAt);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Your Profile</h2>

      <div className={styles.card}>
        <div className={styles.avatar}>{profile.email.charAt(0).toUpperCase()}</div>

        <dl className={styles.details}>
          <div className={styles.row}>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div className={styles.row}>
            <dt>Member since</dt>
            <dd>
              {memberSince.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
          <div className={styles.row}>
            <dt>Account ID</dt>
            <dd>#{profile.accountId}</dd>
          </div>
          <div className={styles.row}>
            <dt>Current balance</dt>
            <dd className={styles.balance}>${Number(profile.balance).toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ProfilePage;
