import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../styles01/AuthContainer.css'

const TeacherSignUp = ({ onSwitchToSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { registerTeacher, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('รหัสผ่านไม่ตรงกัน');
    }
    
    if (password.length < 6) {
      return setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }
    
    try {
      setLoading(true);
      const success = await registerTeacher(email, password, name);
      if (success) {
        setSuccess(true);
      } else {
        setError('ไม่สามารถลงทะเบียนได้ อีเมลอาจถูกใช้งานแล้ว');
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (error.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (error.code === 'auth/weak-password') {
        setError('รหัสผ่านไม่ปลอดภัยเพียงพอ');
      } else {
        setError('เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      setLoading(true);
      const success = await loginWithGoogle();
      if (success) {
        setSuccess(true);
      } else {
        setError('ไม่สามารถลงทะเบียนด้วย Google ได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการลงทะเบียนด้วย Google');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>ลงทะเบียนสำเร็จ!</h2>
        <p>คุณสามารถเข้าสู่ระบบได้แล้ว</p>
        <button onClick={onSwitchToSignIn} className="success-button">เข้าสู่ระบบ</button>
      </div>
    );
  }

  return (
    <div className="teacher-signup">
      <h2>ลงทะเบียนสำหรับครู</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">ชื่อ-นามสกุล</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">อีเมล (Gmail)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <small>รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="signup-btn">
          {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนด้วยอีเมล'}
        </button>
      </form>
      
      <div className="divider">หรือ</div>
      
      <div className="google-signup">
        <button 
          className="google-button"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google logo" />
          ลงทะเบียนด้วย Google
        </button>
      </div>
      
      <p className="signin-link">
        มีบัญชีอยู่แล้ว?{' '}
        <button className="text-button" onClick={onSwitchToSignIn}>
          เข้าสู่ระบบ
        </button>
      </p>
    </div>
  );
};

export default TeacherSignUp;