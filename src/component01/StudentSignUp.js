import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../styles01/AuthContainer.css'

const StudentSignUp = ({ onSwitchToSignIn }) => {
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { registerStudent } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนหรือไม่
    if (!studentId.trim() || !firstName.trim() || !lastName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      console.log('Form submitted with values:', { studentId, firstName, lastName });
      setLoading(true);
      
      // เรียกใช้ฟังก์ชัน registerStudent จาก AuthContext
      const result = await registerStudent(studentId, firstName, lastName);
      console.log('Registration result:', result);
      
      if (result && result.success) {
        setSuccess(true);
      } else {
        // แสดงข้อความผิดพลาดที่ชัดเจนมากขึ้น
        setError(result && result.message 
          ? result.message 
          : 'ไม่สามารถลงทะเบียนได้ โปรดลองอีกครั้งในภายหลัง');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('เกิดข้อผิดพลาดในการลงทะเบียน: ' + (error.message || 'โปรดลองอีกครั้งในภายหลัง'));
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="success-message">
        <h2>ลงทะเบียนสำเร็จ!</h2>
        <p>คุณสามารถเข้าสู่ระบบได้แล้ว</p>
        <button onClick={onSwitchToSignIn} className="primary-button">เข้าสู่ระบบ</button>
      </div>
    );
  }
  
  return (
    <div className="student-signup">
      <h2>ลงทะเบียนสำหรับนักเรียน</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentId">รหัสนักเรียน</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="firstName">ชื่อ</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">นามสกุล</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="primary-button">
          {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
        </button>
      </form>
      
      <p className="login-link">
        มีบัญชีอยู่แล้ว?{' '}
        <button className="text-button" onClick={onSwitchToSignIn}>
          เข้าสู่ระบบ
        </button>
      </p>
    </div>
  );
};

export default StudentSignUp;