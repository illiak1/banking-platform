// frontend/src/components/Navbar.tsx
//
// Rendered once in App.tsx, above every route. Previously this component
// existed but was never imported anywhere (dead code) — it now provides the
// only cross-page navigation the app has.
//
// There is still no route guard (see App.tsx), so this reads the same
// localStorage token every other page reads and re-checks it on each
// navigation via useLocation — good enough to show the right links, though
// the API is still the real gatekeeper for protected data.

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  // Subscribes this component to route changes — its return value is unused,
  // but the subscription is what makes isAuthenticated below re-read
  // localStorage after a login/logout navigation instead of only on mount.
  useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const handleLogout = () => {
    // No server-side session to invalidate — the JWT is stateless, so
    // dropping it client-side is the entire logout.
    localStorage.removeItem('token');
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.linkActive}` : styles.link;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to={isAuthenticated ? '/dashboard' : '/login'} className={styles.brand}>
          🏦 Mini Banking
        </NavLink>

        <div className={styles.links}>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
              <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={linkClass}
                // Avoid double-highlighting: "/" redirects to "/login", so
                // without this the link stays active on unrelated routes too.
                end
              >
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
