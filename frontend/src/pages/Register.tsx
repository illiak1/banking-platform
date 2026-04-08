// frontend/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        <p style={{ marginTop: '10px' }}>
  Already have an account?{' '}
  <span
    onClick={() => navigate('/login')}
    style={{ color: '#2f80ed', cursor: 'pointer' }}
  >
    Login
  </span>
</p>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default RegisterPage;