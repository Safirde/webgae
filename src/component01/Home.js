import React from 'react';
import { Link } from 'react-router-dom';
import '../styles01/Home.css'; // Make sure this path is correct

const Home = () => {
  return (
    <div className="home-container">
      <div className="background-image"></div>
      <div className="background-overlay"></div>
      <div className="home-content">
        <h1 className="main-title">สำรวจระบบสุริยะแบบสมจริง</h1>
        <p className="description">
          ประสบการณ์การเรียนรู้ระบบสุริยะในรูปแบบ AR (Augmented Reality) ที่จะพาคุณท่องจักรวาลแบบไม่เคยมีมาก่อน
        </p>
        <div className="features">
          <div className="feature-item">
            <span className="feature-icon">✦</span>
            <span className="feature-text">สำรวจดาวเคราะห์ทั้ง 8 ดวงในระบบสุริยะได้อย่างใกล้ชิด</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✦</span>
            <span className="feature-text">เรียนรู้ข้อมูลทางดาราศาสตร์ที่ถูกต้องและทันสมัย</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✦</span>
            <span className="feature-text">สัมผัสประสบการณ์ 3 มิติผ่านเทคโนโลยี AR</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✦</span>
            <span className="feature-text">เหมาะสำหรับทุกช่วงวัยและทุกระดับการศึกษา</span>
          </div>
        </div>
        <div className="home-buttons">
          <Link 
            to="/auth" 
            className="auth-button"
            aria-label="Begin using the application"
          >
            Get Started
          </Link>
        </div>   
      </div>
    </div>
  );
};

export default Home;