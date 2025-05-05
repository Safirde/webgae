import React from 'react';
import TeacherSidebar from './TeacherSidebar';
import TeacherProfileIcon from '../ProfileAllUser/TeacherProfileIcon';
import '../styles/TeacherLayout.css';

const TeacherLayout = ({ children, title }) => {
  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      
      <div className="teacher-content">
        <header className="teacher-header">
          <h1 className="page-title">{title}</h1>
          <div className="profile-container">
            <TeacherProfileIcon />
          </div>
        </header>
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout; 