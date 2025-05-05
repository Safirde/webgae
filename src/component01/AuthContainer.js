import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import UserTypeSelector from './UserTypeSelector';
import TeacherSignIn from './TeacherSignIn';
import TeacherSignUp from './TeacherSignUp';
import StudentSignIn from './StudentSignIn';
import StudentSignUp from './StudentSignUp';
import '../styles01/AuthContainer.css'




const AuthContainer = () => {
  const { userType, setUserType } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const handleSwitchToSignIn = () => {
    setIsSignUp(false);
  };
  
  const handleSwitchToSignUp = () => {
    setIsSignUp(true);
  };
  
  const handleBackToUserType = () => {
    setUserType(null);
    setIsSignUp(false);
  };
  
  // ถ้ายังไม่ได้เลือกประเภทผู้ใช้
  if (!userType) {
    return <UserTypeSelector />;
  }
  
  return (
    <div className="center-wrapper">
      <div className="auth-container">
        <button className="back-button" onClick={handleBackToUserType}>
        ⬅️
        </button>

        
        
        {userType === 'teacher' && (
          isSignUp ? (
            <TeacherSignUp onSwitchToSignIn={handleSwitchToSignIn} />
          ) : (
            <TeacherSignIn onSwitchToSignUp={handleSwitchToSignUp} />
          )
        )}
        
        {userType === 'student' && (
          isSignUp ? (
            <StudentSignUp onSwitchToSignIn={handleSwitchToSignIn} />
          ) : (
            <StudentSignIn onSwitchToSignUp={handleSwitchToSignUp} />
          )
        )}
        
      </div>
    </div>
  );
};

export default AuthContainer;