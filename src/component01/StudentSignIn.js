import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../component01/AuthContext';
import '../styles01/AuthContainer.css'
const StudentSignIn = ({ onSwitchToSignUp }) => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { loginStudent } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate student ID before submitting
    if (!studentId || studentId.trim() === '') {
      setError('กรุณากรอกรหัสนักเรียน');
      return;
    }
    
    setError('');
    
    try {
      setLoading(true);
      const success = await loginStudent(studentId);
      
      if (success) {
        console.log('เข้าสู่ระบบสำเร็จ กำลังนำทางไปยังหน้าแบบทดสอบก่อนเรียน');
        // Updated to redirect to PreTestQuiz instead of profile
        navigate('/student/ARLearningPlatform')
        return;
      }
      
      // Move error handling outside the success block
      setError('ไม่พบรหัสนักเรียนในระบบ หรือเกิดข้อผิดพลาดในการเชื่อมต่อ');
    } catch (error) {
      console.error('Login error:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง');
    } finally {
      setLoading(false); // Ensure loading state resets
    }
  };
  
  return (
    <div className="student-signin">
      <h2>เข้าสู่ระบบสำหรับนักเรียน</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentId">รหัสนักเรียน</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="กรุณากรอกรหัสนักเรียน"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      
      <div className="signin-link">
        ยังไม่มีบัญชี?{' '}
        <button className="text-button" onClick={onSwitchToSignUp}>
          ลงทะเบียน
        </button>
      </div>
    </div>
  );
};

export default StudentSignIn;