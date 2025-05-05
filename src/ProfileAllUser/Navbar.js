import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if current path matches the routes we want to keep the navbar for
  const shouldShowNavbar = 
    currentPath.includes('/student/PreTestQuiz') || 
    currentPath.includes('/ARLearningPlatform');
  
  // If we're not on one of the specified routes, don't render the full navbar
  if (!shouldShowNavbar) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo">
            <span className="logo-text">AR Learning</span>
          </Link>
          {/* No menu items as requested */}
        </div>
      </nav>
    );
  }
  
  // For PreTestQuiz and ARLearningPlatform pages, render the full navbar
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <span className="logo-text">AR Learning</span>
        </Link>
        {/* You can add specific menu items for these pages here if needed */}
      </div>
    </nav>
  );
};

export default Navbar;