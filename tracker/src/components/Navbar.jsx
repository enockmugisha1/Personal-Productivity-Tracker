
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <h2>Productivity Tracker</h2>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/goals">Goals</Link>
        <Link to="/habits">Habits</Link>
        <Link to="/notes">Notes</Link>
        <Link to="/settings">Settings</Link>
        {user ? (
          <>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
