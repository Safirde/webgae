import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/TeacherSidebar.css';

const TeacherSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Apply custom scrollbar styling
  useEffect(() => {
    // Target sidebar navigation
    const sidebarNav = document.querySelector('.sidebar-nav');
    
    // Apply scrollbar styles
    const applyScrollbarStyles = (element) => {
      if (!element) return;
      
      // Set basic overflow properties
      element.style.overflowY = 'auto';
      element.style.scrollbarWidth = 'thin';
      element.style.paddingRight = '0';
      
      // Apply custom scrollbar styles through CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
          position: absolute;
          right: 0;
        }
        
        .sidebar-nav::-webkit-scrollbar-track {
          background: #2c3e50;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb {
          background-color: #34495e;
          border-radius: 3px;
          border: 1px solid #2c3e50;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background-color: #3498db;
        }
      `;
      document.head.appendChild(styleElement);
    };
    
    // Apply styles to sidebar nav
    applyScrollbarStyles(sidebarNav);
    
    // Cleanup
    return () => {
      // Remove any added styles when component unmounts
      const styleElement = document.head.querySelector('style:last-child');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear();
      navigate("/auth");
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`teacher-sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">{expanded ? 'Teacher Dashboard' : 'TD'}</h2>
        <button className="toggle-button" onClick={toggleSidebar}>
          {expanded ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-links">
          <li>
            <Link 
              to="/teacher/CrudDashboard" 
              className={`nav-link ${isActiveRoute('/teacher/CrudDashboard') ? 'active' : ''}`}
            >
              <i className="fas fa-user-graduate"></i>
              {expanded && <span>จัดการข้อมูลนักเรียน</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/teacher/ar-dashboard" 
              className={`nav-link ${isActiveRoute('/teacher/ar-dashboard') ? 'active' : ''}`}
            >
              <i className="fas fa-vr-cardboard"></i>
              {expanded && <span>จัดการเนื้อหา AR</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/teacher/TeacherLessonManager" 
              className={`nav-link ${isActiveRoute('/teacher/TeacherLessonManager') ? 'active' : ''}`}
            >
              <i className="fas fa-book"></i>
              {expanded && <span>จัดการบทเรียนและแบบทดสอบ</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/teacher/LessonQuizDashboard" 
              className={`nav-link ${isActiveRoute('/teacher/LessonQuizDashboard') ? 'active' : ''}`}
            >
              <i className="fas fa-tasks"></i>
              {expanded && <span>บันทึกคะแนนแบบทดสอบ</span>}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i>
          {expanded && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </div>
  );
};

export default TeacherSidebar; 