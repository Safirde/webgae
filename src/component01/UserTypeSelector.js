import React from 'react';
import { useAuth } from './AuthContext';
import '../styles01/AuthContainer.css';

const UserTypeSelector = () => {
  const { setUserType } = useAuth();

  return (
    <div className="center-wrapper">
      <div className="user-type-selector">
        <h2 className="neon-text-blue">เลือกประเภทผู้ใช้</h2>
        <div className="user-type-buttons">
          <button
            className="teacher-button"
            onClick={() => setUserType('teacher')}
            aria-label="สำหรับครู"
          >
            ครู
          </button>
          <button
            className="student-button"
            onClick={() => setUserType('student')}
            aria-label="สำหรับนักเรียน"
          >
            นักเรียน
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelector;