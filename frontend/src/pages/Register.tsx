import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import styles from '../styles/Register.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mirrors RegisterDto's @IsStrongPassword rule on the server. Each entry is
 * checked live as the user types so the requirement list can show which
 * rules are already satisfied, rather than only failing after submit.
 */
const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  {
    label: 'An uppercase and a lowercase letter',
    test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  { label: 'A number', test: (pw) => /\d/.test(pw) },
  { label: 'A symbol', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
    errors.password = 'Password does not meet the requirements below';
  }
  return errors;
}

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      await api.post('/auth/register', { email, password });
      toast.success('Account created — you can log in now.');
      navigate('/login');
    } catch (err: any) {
      // The API returns every failed password rule at once under `errors`, so
      // the user can fix them in one pass instead of one per attempt.
      const message = apiErrorMessage(err, 'Registration failed');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2>Create your account</h2>
        <p className={styles.subtitle}>Start banking in under a minute</p>

        <form onSubmit={handleRegister} noValidate>
          <div className={styles.field}>
            <label htmlFor="register-email" className={styles.label}>
              Email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className={styles.label}>
              Password
            </label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordTouched(true)}
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
              aria-invalid={Boolean(fieldErrors.password)}
            />

            {passwordTouched && (
              <ul className={styles.ruleList}>
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={met ? styles.ruleMet : styles.ruleUnmet}
                    >
                      {met ? '✓' : '·'} {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className={styles.linkText}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} className={styles.link}>
            Login
          </span>
        </p>
        {error && (
          <p className={styles.error} style={{ whiteSpace: 'pre-line' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
