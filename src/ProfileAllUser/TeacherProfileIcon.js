import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../component01/AuthContext';
import "../ProfileAllUser/TeacherProfile.css";

const TeacherProfileIcon = () => {
  const { currentUser, logout, isAuthorizedTeacher } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // ใช้ข้อมูลกำหนดชื่อที่จะแสดง
  const userName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`
    : isAuthorizedTeacher ? 'Admin' : 'Teacher';

  return (
    <div className="teacher-profile-container" ref={dropdownRef}>
      <button className="profile-name-button" onClick={toggleDropdown}>
        <div className="profile-circle">
          {/* ตัวอักษรแรกของชื่อ */}
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="profile-name">{userName}</span>
      </button>
      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="user-info">
              <p className="user-name">{userName}</p>
              {currentUser?.email && (
                <p className="teacher-email">{currentUser.email}</p>
              )}
            </div>
          </div>
          <div className="dropdown-menu">
            <button onClick={handleLogout} className="menu-item logout">
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfileIcon;