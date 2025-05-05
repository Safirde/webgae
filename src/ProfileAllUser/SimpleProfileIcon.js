import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../component01/AuthContext';
import "../ProfileAllUser/StudentProfile.css";

const SimpleProfileIcon = () => {
  const { currentUser, logout } = useAuth();
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
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Determine the name to display
  const userName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`
    : 'นักเรียน';
    
  // Get first character for avatar
  const avatarText = userName.charAt(0).toUpperCase();

  // Get display name - first name only or shortened if very long
  const displayName = currentUser?.firstName 
    ? (currentUser.firstName.length > 10 
        ? currentUser.firstName.substring(0, 10) + '...' 
        : currentUser.firstName)
    : 'นักเรียน';

  return (
    <div className="simple-profile-container" ref={dropdownRef}>
      <button className="profile-name-button" onClick={toggleDropdown} aria-label="เปิดเมนูโปรไฟล์">
        <div className="profile-circle">
          {avatarText}
        </div>
        <span className="profile-name">{displayName}</span>
      </button>
      
      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="user-info">
              <p className="user-name">{userName}</p>
              {currentUser?.studentId && (
                <p className="student-id">รหัส: {currentUser.studentId}</p>
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

export default SimpleProfileIcon;