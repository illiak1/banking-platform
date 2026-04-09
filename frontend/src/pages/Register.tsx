import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Register.module.css'; 

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:3000/auth/register', { email, password });
      console.log(res.data);
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      console.log(err.response); 
      setError(err.response?.data?.message || 'Registration failed!');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2>Registration</h2>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>Register</button>
        </form>
        <p className={styles.linkText}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className={styles.link}
          >
            Login
          </span>
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;