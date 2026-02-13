/**
 * Navbar Component
 * 
 * Responsive navigation bar with authentication and role-based menu items
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/api';
import { toast } from 'react-toastify';
import { isAdmin } from '../utils/rbac';

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
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div className="nav-backdrop" onClick={closeMobileMenu} />
      )}
      
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
            🐾 PawWell Care Center
          </Link>

          <button 
            className="menu-icon" 
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="menu-icon-line"></span>
            <span className="menu-icon-line"></span>
            <span className="menu-icon-line"></span>
          </button>

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

          {isAuthenticated && (
            <li className="nav-item">
              <Link
                to="/booking"
                className={`nav-link ${isActive('/booking')}`}
                onClick={closeMobileMenu}
              >
                Booking
              </Link>
            </li>
          )}

          {isAuthenticated && (
            <li className="nav-item">
              <Link
                to="/activity-log"
                className={`nav-link ${isActive('/activity-log')}`}
                onClick={closeMobileMenu}
              >
                Activity Log
              </Link>
            </li>
          )}

          <li className="nav-item">
            <Link
              to="/about"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              About
            </Link>
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
            <Link
              to="/about#contact"
              className="nav-link"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              {/* Dashboard Link - Role-based */}
              <li className="nav-item">
                <Link
                  to={isAdmin(user) ? "/admin/dashboard" : "/dashboard"}
                  className={`nav-link ${isActive(isAdmin(user) ? '/admin/dashboard' : '/dashboard')}`}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              </li>

              {/* Admin-Only Links */}
              {isAdmin(user) && (
                <>
                  <li className="nav-item">
                    <Link
                      to="/admin/users"
                      className={`nav-link ${isActive('/admin/users')}`}
                      onClick={closeMobileMenu}
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/admin/bookings"
                      className={`nav-link ${isActive('/admin/bookings')}`}
                      onClick={closeMobileMenu}
                    >
                      All Bookings
                    </Link>
                  </li>
                </>
              )}

              {/* User/Pet Owner Links */}
              {!isAdmin(user) && (
                <>
                  <li className="nav-item">
                    <Link
                      to="/pets"
                      className={`nav-link ${isActive('/pets')}`}
                      onClick={closeMobileMenu}
                    >
                      My Pets
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/booking"
                      className={`nav-link ${isActive('/booking')}`}
                      onClick={closeMobileMenu}
                    >
                      My Bookings
                    </Link>
                  </li>
                </>
              )}

              <li className="nav-item">
                <span className="nav-link user-greeting">
                  Hello, {user?.firstName || user?.first_name || 'User'}
                  {isAdmin(user) && <span className="admin-badge"> (Admin)</span>}
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
    </>
  );
};

export default Navbar;
