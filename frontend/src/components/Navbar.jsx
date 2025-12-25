/**
 * Navbar Component
 * 
 * Responsive navigation bar with authentication buttons
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/api';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      // Still logout locally even if API call fails
      logout();
      navigate('/');
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          🐾 PawWell Care Center
        </Link>

        <div className="menu-icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </div>

        <ul className={isMobileMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${isActive('/')}`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
          </li>

          <li className="nav-item">
            <a
              href="/#about"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              About
            </a>
          </li>

          <li className="nav-item">
            <a
              href="/#services"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              Services
            </a>
          </li>

          <li className="nav-item">
            <a
              href="/#contact"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              Contact
            </a>
          </li>

          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard')}`}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <span className="nav-link user-greeting">
                  Hello, {user?.first_name || 'User'}
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-btn btn-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link
                  to="/login"
                  className="nav-btn btn-login"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/signup"
                  className="nav-btn btn-signup"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
