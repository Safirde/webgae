import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import '../styles01/AuthContainer.css'


const TeacherSignIn = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const navigate = useNavigate();
  const { loginTeacher, loginWithGoogle, resetPassword, networkStatus } = useAuth();
  const auth = getAuth();

  useEffect(() => {
    if (!networkStatus) {
      setError('ไม่พบการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณและลองอีกครั้ง');
    } else {
      if (error === 'ไม่พบการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณและลองอีกครั้ง') {
        setError('');
      }
    }
  }, [networkStatus, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!networkStatus) {
      setError('ไม่สามารถเข้าสู่ระบบขณะออฟไลน์ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ');
      return;
    }

    try {
      setLoading(true);
      console.log('กำลังพยายามเข้าสู่ระบบด้วย:', email);

      const success = await loginTeacher(email, password);

      if (success) {
        console.log('เข้าสู่ระบบสำเร็จ กำลังนำทางไปยังหน้า Dashboard');
        navigate('/teacher/CrudDashboard');
      } else {
        setError('ไม่สามารถเข้าสู่ระบบได้ โปรดตรวจสอบอีเมลและรหัสผ่าน หรือบัญชีของคุณไม่ใช่บัญชีครู');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + (error.message || 'โปรดลองอีกครั้งในภายหลัง'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    if (!networkStatus) {
      setError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ขณะออฟไลน์ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ');
      return;
    }

    try {
      setLoading(true);
      console.log('เริ่มเข้าสู่ระบบด้วย Google');
      const success = await loginWithGoogle();

      if (success) {
        console.log('เข้าสู่ระบบ Google สำเร็จ, กำลังนำทางไปยัง Dashboard');
        navigate('/teacher/CrudDashboard');
      } else {
        console.error('เข้าสู่ระบบ Google ล้มเหลว');
        setError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ หรือบัญชีของคุณไม่ใช่บัญชีครู');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google: ' + (error.message || 'โปรดลองอีกครั้งในภายหลัง'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetEmail) {
      setError('กรุณากรอกอีเมลสำหรับรีเซ็ตรหัสผ่าน');
      return;
    }

    if (!networkStatus) {
      setError('ไม่สามารถรีเซ็ตรหัสผ่านได้ขณะออฟไลน์ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(resetEmail);
      setResetEmailSent(true);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('ไม่พบอีเมลนี้ในระบบ');
      } else {
        setError('เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน: ' + (error.message || 'โปรดลองอีกครั้งในภายหลัง'));
      }
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setForgotPasswordMode(false);
    setResetEmailSent(false);
    setResetEmail('');
    setError('');
  };

  const handleForgotPassword = () => {
    setForgotPasswordMode(true);
    setResetEmail(email);
  };
  
  if (forgotPasswordMode) {
    return (
      <div className="teacher-signin">
        <h2>รีเซ็ตรหัสผ่าน</h2>

        {resetEmailSent ? (
          <div className="success-message">
            <p>ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว</p>
            <p>กรุณาตรวจสอบอีเมลของคุณและทำตามคำแนะนำ</p>
            <button className="sign-in-btn" onClick={backToLogin}>
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            <p>กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">อีเมล</label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  style={{ width: '100%', minWidth: '380px', maxWidth: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" disabled={loading || !networkStatus} className="sign-in-btn">
                {loading ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </button>

              <button type="button" onClick={backToLogin} className="text-button back-to-login">
                &larr; กลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="teacher-signin">
      <h2>เข้าสู่ระบบสำหรับครู</h2>

      {!networkStatus && (
        <div className="network-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
          <p style={{ margin: 0 }}>⚠️ ไม่พบการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณ</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">อีเมล (Gmail)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', minWidth: '380px', maxWidth: '100%', boxSizing: 'border-box' }}
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
            style={{ width: '100%', minWidth: '380px', maxWidth: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={loading || !networkStatus} className="sign-in-btn">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วยอีเมล'}
        </button>

        <button type="button" onClick={handleForgotPassword} className="text-button forgot-password">
          ลืมรหัสผ่าน?
        </button>
      </form>

      <div className="divider">หรือ</div>

      <div className="google-signin">
        <button
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading || !networkStatus}
        >
          <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google logo" />
          เข้าสู่ระบบด้วย Google
        </button>
      </div>

      <p className="signup-link">
        ยังไม่มีบัญชี?{' '}
        <button className="text-button" onClick={onSwitchToSignUp}>
          ลงทะเบียน
        </button>
      </p>
    </div>
  );
};

export default TeacherSignIn;