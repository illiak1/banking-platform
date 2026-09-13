import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import styles from '../styles/Login.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!password) {
    errors.password = 'Password is required';
  }
  return errors;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      // 429 is the rate limiter, which deserves a clearer message than the
      // generic one the server sends.
      const message =
        err?.response?.status === 429
          ? 'Too many login attempts. Please wait a minute and try again.'
          : apiErrorMessage(err, 'Server error');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form} noValidate>
        <h2>Welcome back</h2>
        <p className={styles.subtitle}>Log in to manage your account</p>

        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.label}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <span className={styles.fieldError}>{fieldErrors.email}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.label}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <span className={styles.fieldError}>{fieldErrors.password}</span>
          )}
        </div>

        <button type="submit" className={styles.button} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </button>
        <p className={styles.linkText}>
          Don’t have an account?{' '}
          <span onClick={() => navigate('/register')} className={styles.link}>
            Register
          </span>
        </p>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
