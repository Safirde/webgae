import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./component01/AuthContext";
import AuthContainer from "./component01/AuthContainer";
import CrudDashboard from "./component01/CrudDashboard";
import ARDashboard from "./component02/ARDashboard";
import ProtectedRoute from "./component01/ProtectedRoute";
import ARLearningPlatform from "./component03/ARLearningPlatform";

import ScoreDashboard from "./component03/ScoreDashboard"; // เพิ่ม import สำหรับหน้าดูคะแนน
import StudentProfile from "./ProfileAllUser/SimpleProfileIcon"; // เพิ่ม import สำหรับหน้าโปรไฟล์นักเรียน
import TeacherLessonManager from "./component03/TeacherLessonManager"; // เพิ่ม import สำหรับหน้าจัดการบทเรียน
import LessonQuizDashboard from "./component03/LessonQuizDashboard"; // เพิ่ม import สำหรับหน้าจัดการบทเรียน
import StudentProgressDashboard from "./component04/StudentProgressDashboard"; // เพิ่ม import สำหรับหน้าจัดการบทเรียน
import Home from "./component01/Home"; // เพิ่ม import สำหรับหน้าแรก

const App = () => {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthContainer />} />

              {/* ป้องกันหน้า CRUD Dashboard (ต้องล็อกอิน) */}
              <Route 
                path="/teacher/CrudDashboard" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <CrudDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* ป้องกันหน้า AR Dashboard (ต้องล็อกอิน) */}
              <Route 
                path="/teacher/ar-dashboard" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <ARDashboard />
                  </ProtectedRoute>        
                } 
              />
              
              {/* ป้องกันหน้า AR Dashboard (ต้องล็อกอิน) */}
              <Route 
                path="" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <ScoreDashboard />
                  </ProtectedRoute>        
                } 
              />

              {/* ป้องกันหน้า AR Dashboard (ต้องล็อกอิน) */}
              <Route 
                path="/teacher/LessonQuizDashboard" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <LessonQuizDashboard/>
                  </ProtectedRoute>        
                } 
              />

              <Route 
                path="/teacher/TeacherLessonManager" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <TeacherLessonManager />
                  </ProtectedRoute>        
                } 
              />

              <Route 
                path="/teacher/LessonQuizDashboard" 
                element={
                  <ProtectedRoute requiredUserType="teacher">
                    <LessonQuizDashboard />
                  </ProtectedRoute>        
                } 
              />

              {/* เพิ่มเส้นทางสำหรับหน้าโปรไฟล์นักเรียน (ต้องล็อกอิน) */}
              <Route
                path="/student/profile"
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentProfile />
                  </ProtectedRoute> 
                }
              />
     

           

              {/* ป้องกันหน้า AR Learning Platform (ไม่มีการตรวจสอบ) */}
              <Route
                path="/student/ARLearningPlatform"
                element={
                  <ProtectedRoute requiredUserType="student">
                    <ARLearningPlatform />
                  </ProtectedRoute> 
                }
              />
              
              {/* Add route for individual lesson pages */}
              <Route
                path="/student/lesson/:id"
                element={
                  <ProtectedRoute requiredUserType="student">
                    <ARLearningPlatform />
                  </ProtectedRoute> 
                }
              />
              
              {/* Add route for pre-test quiz */}
              <Route
                path="/student/pretest/:id"
                element={
                  <ProtectedRoute requiredUserType="student">
                    <ARLearningPlatform />
                  </ProtectedRoute> 
                }
              />
              
              <Route
                path="/student/StudentProgressDashboard"
                element={
                  <ProtectedRoute requiredUserType="student">
                    <StudentProgressDashboard/>
                  </ProtectedRoute> 
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;