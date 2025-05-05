import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SimpleProfileIcon from '../ProfileAllUser/SimpleProfileIcon';
import '../styles04/Navbar.css'; // Make sure to create this CSS file

const Navbar = ({ activePage, onLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigateToARLearning = () => {
    navigate("/student/ARLearningPlatform");
    setMenuOpen(false);
  };

  const navigateToProgress = () => {
    navigate("/student/StudentProgressDashboard");
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header id="ar-learning-header">
      <nav className="ar-learning-nav">
        <div className="ar-learning-logo">
          <Link to="/">
            <i className="fas fa-graduation-cap nav-logo-icon"></i> AR Learning
          </Link>
        </div>
        
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}>
          {menuOpen ? '✕' : '☰'}
        </button>
        
        <div className={`ar-nav-menu ${menuOpen ? 'active' : ''}`}>
          <Link
            to="/student/ARLearningPlatform"
            className={`ar-nav-item ${activePage === 'arlearning' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <i className="fas fa-book-open nav-icon"></i> บทเรียน
          </Link>
       
          <Link
            to="/student/StudentProgressDashboard"
            className={`ar-nav-item ${activePage === 'progress' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <i className="fas fa-chart-line nav-icon"></i> ความก้าวหน้า
          </Link>
          
          <Link 
            to="/auth" 
            className="ar-nav-item logout-btn" 
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              if (onLogout) onLogout();
            }}
          >
            <i className="fas fa-sign-out-alt nav-icon"></i> ออกจากระบบ
          </Link>
        </div>
        
        <div className="profile-icon-wrapper">
          <SimpleProfileIcon />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;