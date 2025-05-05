import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../styles03/Sidebar.css";

const Sidebar = ({ activePage, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine which page is active
  const isPreTestActive = location.pathname.includes('/PreTestQuiz');
  const isARLearningActive = location.pathname.includes('/ARLearningPlatform');
  const isProgressActive = location.pathname.includes('/StudentProgressDashboard');
  
  const navigateTo = (path) => {
    navigate(path);
  };
  
  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.clear();
        navigate("/student/StudentSignIn");
      }
    }
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>เมนูการเรียนรู้</h3>
      </div>
      <div className="sidebar-menu">
        <div 
          className={`sidebar-item ${isPreTestActive ? 'active' : ''}`}
          onClick={() => navigateTo('/student/PreTestQuiz')}
        >
          <i className="sidebar-icon">📝</i>
          <span>แบบทดสอบก่อนเรียน</span>
        </div>
        <div 
          className={`sidebar-item ${isARLearningActive ? 'active' : ''}`}
          onClick={() => navigateTo('/student/ARLearningPlatform')}
        >
          <i className="sidebar-icon">📚</i>
          <span>บทเรียน AR</span>
        </div>
        <div 
          className={`sidebar-item ${isProgressActive ? 'active' : ''}`}
          onClick={() => navigateTo('/student/StudentProgressDashboard')}
        >
          <i className="sidebar-icon">📊</i>
          <span>ความก้าวหน้าการเรียน</span>
        </div>
      </div>
      <div className="sidebar-footer">
        <div 
          className="logout-button"
          onClick={handleLogout}
        >
          <i className="sidebar-icon">🚪</i>
          <span>ออกจากระบบ</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;