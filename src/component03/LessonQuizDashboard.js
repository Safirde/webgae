// ในไฟล์ LessonQuizDashboard.js

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation,Link } from 'react-router-dom';
import "../styles/LessonQuizDashboard.css";
import { useAuth } from '../component01/AuthContext';
import TeacherProfileIcon from '../ProfileAllUser/TeacherProfileIcon';
import ExpandableStudentTable from './ExpandableStudentTable'; // นำเข้าคอมโพเนนต์ใหม่
import StudentScoreChart from './StudentScoreChart'; // เพิ่มบรรทัดนี้
import TeacherLayout from '../components/TeacherLayout';

// กำหนด URL ของ API
const API_BASE_URL = "http://mgt2.pnu.ac.th/safirde";
const SCORE_API_URL = `${API_BASE_URL}/protest_score_db/score_protest_api.php`;

// ข้อมูลบทเรียนที่มีในระบบ
const LESSON_DATA = [
  { id: 1, title: "องค์ประกอบของระบบสุริยะ" },
  { id: 2, title: "ลักษณะของดาวเคราะห์แต่ละดวง" },
  { id: 3, title: "ลำดับของดาวเคราะห์" },
  { id: 4, title: "การโคจรของดาวเคราะห์" },
  { id: 5, title: "ปรากฏการณ์เกี่ยวกับดวงจันทร์" }
];

const LessonQuizDashboard = () => {
  // State ต่างๆ (เหมือนเดิม)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'student_id', direction: 'ascending' });
  const [selectedLessonId, setSelectedLessonId] = useState('all');
  const [lessons, setLessons] = useState(LESSON_DATA);
  
  // Apply custom scrollbar styling
  useEffect(() => {
    // Target elements that need custom scrollbars
    const quizDashboard = document.querySelector('.quiz-dashboard');
    const tableWrapper = document.querySelector('.table-wrapper');
    
    // Apply scrollbar styles
    const applyScrollbarStyles = (element) => {
      if (!element) return;
      
      // Set basic overflow properties
      element.style.overflowY = 'auto';
      element.style.scrollbarWidth = 'thin';
      element.style.paddingRight = '0';
      
      // Apply custom scrollbar styles through CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .quiz-dashboard::-webkit-scrollbar,
        .table-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
          position: absolute;
          right: 0;
        }
        
        .quiz-dashboard::-webkit-scrollbar-track,
        .table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .quiz-dashboard::-webkit-scrollbar-thumb,
        .table-wrapper::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
          border: 2px solid #f1f5f9;
        }
        
        .quiz-dashboard::-webkit-scrollbar-thumb:hover,
        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `;
      document.head.appendChild(styleElement);
    };
    
    // Apply styles to elements
    applyScrollbarStyles(quizDashboard);
    applyScrollbarStyles(tableWrapper);
    
    // Cleanup
    return () => {
      // Remove any added styles when component unmounts
      const styleElement = document.head.querySelector('style:last-child');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

    // ฟังก์ชัน Logout
    const handleLogout = () => {
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.clear();
        navigate("/auth");
      }
    };
  
  
  // ขยายข้อมูลสถิติเพิ่มเติมตามหลักการวิจัย (เหมือนเดิม)
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    averagePretest: 0,
    averagePosttest: 0,
    averageGain: 0,
    e1Value: 0,
    e2Value: 0,
    effectivenessIndex: 0,
    percentageOfProgress: 0,
    reliabilityKR20: 0.85,
    tTestValue: 0,
    pValue: 0
  });

  // เพิ่มข้อมูลเกี่ยวกับข้อสอบ (เหมือนเดิม)
  const [testInfo, setTestInfo] = useState({
    totalQuestions: 5,
    maxScore: 5,
    passingScore: 3,
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // เพิ่มฟลีกใหม่สำหรับเลือกโหมดการแสดงผล
  const [tableMode, setTableMode] = useState('grouped'); // 'grouped' หรือ 'detailed'

  // ตรวจสอบ query params เมื่อโหลดครั้งแรก (เหมือนเดิม)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const lessonIdParam = queryParams.get('lesson_id');
    if (lessonIdParam) {
      setSelectedLessonId(lessonIdParam);
    }
  }, [location.search]);


  
  // ตรวจสอบสิทธิ์ครู (เหมือนเดิม)
  useEffect(() => {
    const checkTeacherAuth = () => {
      const isTeacher = 
        (currentUser && currentUser.role === 'teacher') || 
        localStorage.getItem('userRole') === 'teacher';
    };
    
    checkTeacherAuth();
  }, [currentUser, navigate]);

  // ดึงข้อมูลคะแนนจาก API (เหมือนเดิม)
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      
      try {
        // สร้าง URL พร้อมพารามิเตอร์สำหรับกรอง
        let url = SCORE_API_URL;
        let params = [];
        
        if (selectedLessonId !== 'all') {
          params.push(`lesson_id=${selectedLessonId}`);
        }
        
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          // เพิ่มการคำนวณข้อมูลเพิ่มเติมสำหรับแต่ละคน
          const enhancedData = data.data.map(student => {
            const preTestScore = parseFloat(student.pre_test_score) || 0;
            const postTestScore = parseFloat(student.post_test_score) || 0;
            
            // คำนวณค่าเพิ่มเติม
            const gainScore = postTestScore - preTestScore; // คะแนนที่เพิ่มขึ้น
            const gainScoreSquared = gainScore * gainScore; // D²
            const percentGain = (preTestScore !== 0) ? 
              ((postTestScore - preTestScore) / preTestScore) * 100 : 0; // ร้อยละที่เพิ่มขึ้น
            
            // คำนวณดัชนีประสิทธิผลรายบุคคล
            const maxScore = testInfo.maxScore;
            const effectivenessIndex = (preTestScore < maxScore) ? 
              (postTestScore - preTestScore) / (maxScore - preTestScore) : 0;
            
            // คำนวณร้อยละความก้าวหน้า
            const percentageProgress = ((postTestScore - preTestScore) / maxScore) * 100;
            
            // การแสดงผลผ่าน/ไม่ผ่าน
            const isPassed = postTestScore >= testInfo.passingScore;
            
            // แปลงวันที่ให้อยู่ในรูปแบบที่ต้องการ
            let formattedDate = student.created_at;
            try {
              if (student.created_at) {
                const date = new Date(student.created_at);
                formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
              }
            } catch (e) {
              console.error("Error formatting date:", e);
            }
            
            return {
              ...student,
              pre_test_score: preTestScore,
              post_test_score: postTestScore,
              gain_score: gainScore,
              gain_score_squared: gainScoreSquared,
              percent_gain: percentGain.toFixed(2),
              effectiveness_index: effectivenessIndex.toFixed(3),
              percentage_progress: percentageProgress.toFixed(2),
              passed: isPassed,
              formatted_date: formattedDate
            };
          });
          
          setScores(enhancedData);
          
          // คำนวณสถิติเพิ่มเติม
          calculateExtendedStats(enhancedData);
        } else {
          console.error("รูปแบบข้อมูลไม่ถูกต้อง:", data);
          setScores([]);
          setError("รูปแบบข้อมูลไม่ถูกต้อง โปรดติดต่อผู้ดูแลระบบ");
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
        setError("ไม่สามารถโหลดข้อมูลคะแนนได้ โปรดลองอีกครั้งในภายหลัง");
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, [selectedLessonId, testInfo.maxScore, testInfo.passingScore]);
  
  const calculateExtendedStats = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setStats({...stats, totalStudents: 0});
      return;
    }
    
    // นับจำนวนนักเรียนที่ไม่ซ้ำกัน โดยใช้ Set เพื่อเก็บรหัสนักเรียนที่ไม่ซ้ำ
    const uniqueStudentIds = new Set(data.map(student => student.student_id));
    const totalStudents = uniqueStudentIds.size;
    
    // คำนวณคะแนนเฉลี่ย
    const sumPretest = data.reduce((sum, student) => sum + student.pre_test_score, 0);
    const sumPosttest = data.reduce((sum, student) => sum + student.post_test_score, 0);
    const sumGain = data.reduce((sum, student) => sum + student.gain_score, 0);
    
    const averagePretest = sumPretest / data.length;
    const averagePosttest = sumPosttest / data.length;
    const averageGain = sumGain / data.length;
    
    // คำนวณ E1/E2
    const e1Value = (averagePretest / testInfo.maxScore) * 100;
    const e2Value = (averagePosttest / testInfo.maxScore) * 100;
    
    // คำนวณดัชนีประสิทธิผลรวม
    const effectivenessIndex = (averagePosttest - averagePretest) / 
      (testInfo.maxScore - averagePretest);
    
    // คำนวณร้อยละความก้าวหน้าเฉลี่ย
    const percentageOfProgress = (averageGain / testInfo.maxScore) * 100;
    
    // คำนวณ t-test (paired samples)
    const differences = data.map(student => student.gain_score);
    const meanDifference = averageGain;
    const sumSquaredDifferences = data.reduce(
      (sum, student) => sum + Math.pow(student.gain_score - meanDifference, 2), 0
    );
    const varianceDifferences = sumSquaredDifferences / (data.length - 1);
    const standardDeviation = Math.sqrt(varianceDifferences);
    const standardError = standardDeviation / Math.sqrt(data.length);
    const tTestValue = meanDifference / standardError;
    
    // คำนวณ p-value (จำเป็นต้องใช้ไลบรารีเพิ่มเติมหรือตารางค่าวิกฤต)
    let pValue = "< 0.001"; // ควรใช้ไลบรารีเช่น jStat เพื่อคำนวณค่านี้อย่างแม่นยำ
    
    // สำหรับ KR-20 จำเป็นต้องมีข้อมูลคะแนนรายข้อ
    
    setStats({
      totalStudents,
      averagePretest,
      averagePosttest,
      averageGain,
      highestScore: Math.max(...data.map(s => s.post_test_score)),
      lowestScore: Math.min(...data.map(s => s.post_test_score)),
      e1Value,
      e2Value,
      effectivenessIndex,
      percentageOfProgress,
      reliabilityKR20: 0.85, // ควรคำนวณจากข้อมูลจริง
      tTestValue,
      pValue
    });
  };

  // ฟังก์ชันในการเรียงข้อมูล
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // เรียงข้อมูลตามการตั้งค่า
  const sortedScores = useMemo(() => {
    if (!Array.isArray(scores)) {
      return [];
    }
    
    let sortableItems = [...scores];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (!a || !b) return 0;
        
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        if (sortConfig.key === 'score' || sortConfig.key === 'post_test_score' || 
            sortConfig.key === 'pre_test_score' || sortConfig.key === 'gain_score') {
          const aValue = parseFloat(a[sortConfig.key]) || 0;
          const bValue = parseFloat(b[sortConfig.key]) || 0;
          
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          }
          return bValue - aValue;
        }
        
        const aString = String(a[sortConfig.key] || '');
        const bString = String(b[sortConfig.key] || '');
        
        if (sortConfig.direction === 'ascending') {
          return aString.localeCompare(bString);
        }
        return bString.localeCompare(aString);
      });
    }
    return sortableItems;
  }, [scores, sortConfig]);
  
  // กรองข้อมูลตามคำค้นหา
  const filteredScores = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedScores;
    }
    
    return sortedScores.filter(student => {
      if (!student) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (student.student_id && student.student_id.toLowerCase().includes(searchLower)) ||
        (student.name && student.name.toLowerCase().includes(searchLower)) ||
        (student.lesson_title && student.lesson_title.toLowerCase().includes(searchLower))
      );
    });
  }, [sortedScores, searchTerm]);

  return (
    <TeacherLayout title="บันทึกคะแนนแบบทดสอบ">
      <div className="quiz-dashboard">
        {/* แสดงแจ้งเตือนถ้าไม่ใช่ผู้ใช้ที่มีสิทธิ์ */}
        {error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">ลองใหม่</button>
          </div>
        ) : (
          <>
            {/* ตัวเลือกบทเรียน */}
            <div className="filter-section content-card">
              <div className="lesson-filter-container">
                <div className="filter-group">
                  <label htmlFor="lesson-select">เลือกบทเรียน: </label>
                  <select 
                    id="lesson-select" 
                    value={selectedLessonId} 
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="lesson-select"
                  >
                    <option value="all">ทุกบทเรียน</option>
                    {lessons.map(lesson => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title || `บทเรียนที่ ${lesson.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="view-mode-container">
                  <span className="view-mode-label">รูปแบบการแสดงผล:</span>
                  <div className="view-mode-buttons">
                    <button 
                      className={`view-mode-button ${tableMode === 'grouped' ? 'active' : ''}`}
                      onClick={() => setTableMode('grouped')}
                    >
                      <i className="fas fa-layer-group"></i> แบบจัดกลุ่มนักเรียน
                    </button>
                    <button 
                      className={`view-mode-button ${tableMode === 'detailed' ? 'active' : ''}`}
                      onClick={() => setTableMode('detailed')}
                    >
                      <i className="fas fa-th-list"></i> แบบละเอียดทุกรายการ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* สรุปสถิติคะแนน */}
            <div className="content-card">
              <h3 className="section-title">สรุปสถิติคะแนน</h3>
              <div className="stats-container">
                <div className="stat-card">
                  <h3>จำนวนนักเรียนทั้งหมด</h3>
                  <p className="stat-value">{stats.totalStudents}</p>
                </div>
                <div className="stat-card">
                  <h3>คะแนนเฉลี่ยก่อนเรียน</h3>
                  <p className="stat-value">{stats.averagePretest.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <h3>คะแนนเฉลี่ยหลังเรียน</h3>
                  <p className="stat-value">{stats.averagePosttest.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <h3>คะแนนที่เพิ่มขึ้นเฉลี่ย</h3>
                  <p className="stat-value">{stats.averageGain.toFixed(2)}</p>
                </div>
              </div>
              
              {/* ประสิทธิภาพของสื่อการเรียนรู้ */}
              <div className="stats-container">
                <div className="stat-card">
                  <h3>ประสิทธิภาพ E1/E2</h3>
                  <p className="stat-value">{stats.e1Value.toFixed(2)}/{stats.e2Value.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <h3>ดัชนีประสิทธิผล (E.I.)</h3>
                  <p className="stat-value">{stats.effectivenessIndex.toFixed(3)}</p>
                </div>
                <div className="stat-card">
                  <h3>ร้อยละความก้าวหน้า</h3>
                  <p className="stat-value">{stats.percentageOfProgress.toFixed(2)}%</p>
                </div>
                <div className="stat-card">
                  <h3>ความเชื่อมั่น (KR-20)</h3>
                  <p className="stat-value">{stats.reliabilityKR20.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Chart component */}
            <div className="content-card">
              <h3 className="section-title">กราฟแสดงคะแนนนักเรียน</h3>
              <StudentScoreChart scores={filteredScores} testInfo={testInfo} />
            </div>

            {/* ตารางคะแนน */}
            <div className="content-card">
              <div style={{ position: 'relative', marginBottom: '60px' }}>
                <h3 className="section-title">
                  ตารางคะแนนนักเรียน
                  <button 
                    className="export-button" 
                    onClick={() => {
                      if (!Array.isArray(filteredScores) || filteredScores.length === 0) {
                        alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');
                        return;
                      }
                      
                      // สร้าง CSV สำหรับดาวน์โหลด
                      let csvContent = "รหัสนักศึกษา,ชื่อ-นามสกุล,บทเรียน,คะแนนก่อนเรียน,คะแนนหลังเรียน,คะแนนที่เพิ่มขึ้น,ดัชนีประสิทธิผล,ร้อยละความก้าวหน้า,วันที่ทำแบบทดสอบ\n";
                      
                      filteredScores.forEach(student => {
                        const studentId = student.student_id || '';
                        const name = student.name || '';
                        const lessonTitle = student.lesson_title || '';
                        const preScore = student.pre_test_score !== null ? student.pre_test_score : '';
                        const postScore = student.post_test_score !== null ? student.post_test_score : '';
                        const gainScore = student.gain_score !== null ? student.gain_score : '';
                        const effectivenessIndex = student.effectiveness_index !== null ? student.effectiveness_index : '';
                        const percentageProgress = student.percentage_progress !== null ? student.percentage_progress : '';
                        const date = student.formatted_date || student.created_at || '-';
                        
                        csvContent += `${studentId},${name},${lessonTitle},${preScore},${postScore},${gainScore},${effectivenessIndex},${percentageProgress},${date}\n`;
                      });
                      
                      // สร้าง Blob และ URL
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      
                      // สร้าง element a สำหรับดาวน์โหลด
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `lesson_quiz_scores_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      
                      // คลิกลิงก์เพื่อดาวน์โหลด
                      link.click();
                      
                      // ลบลิงก์ออกจาก DOM
                      document.body.removeChild(link);
                    }}
                  >
                    <i className="fas fa-download"></i> ดาวน์โหลด CSV
                  </button>
                </h3>
                
                {/* Search box repositioned to above the table */}
                <div className="search-filter-group">
                  <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยรหัสนักเรียนหรือชื่อ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button 
                        className="clear-search" 
                        onClick={() => setSearchTerm('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {tableMode === 'grouped' ? (
                <ExpandableStudentTable 
                  scores={filteredScores}
                  testInfo={testInfo}
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                />
              ) : (
                <div className="table-wrapper">
                  <table className="scores-table">
                    <thead>
                      <tr>
                        <th className="fixed-column">ลำดับ</th>
                        <th className="sortable-header" onClick={() => requestSort('student_id')}>
                          รหัสนักศึกษา
                          {sortConfig.key === 'student_id' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('name')}>
                          ชื่อ-นามสกุล
                          {sortConfig.key === 'name' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('lesson_title')}>
                          บทเรียน
                          {sortConfig.key === 'lesson_title' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('pre_test_score')}>
                          คะแนนก่อนเรียนรวม
                          {sortConfig.key === 'pre_test_score' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('post_test_score')}>
                          คะแนนหลังเรียนรวม
                          {sortConfig.key === 'post_test_score' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('quiz_score')}>
                          คะแนนแบบทดสอบท้ายบทเรียน
                          {sortConfig.key === 'quiz_score' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('effectiveness_index')}>
                          ดัชนีประสิทธิผล
                          {sortConfig.key === 'effectiveness_index' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('percentage')}>
                          ร้อยละความก้าวหน้า
                          {sortConfig.key === 'percentage' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                        <th className="sortable-header" onClick={() => requestSort('date')}>
                          วันที่ล่าสุด
                          {sortConfig.key === 'date' && (
                            <span className={sortConfig.direction === 'ascending' ? 'ascending' : 'descending'}></span>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScores.length > 0 ? (
                        filteredScores.map((student, index) => (
                          <tr key={`${student.id || index}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{student.student_id}</td>
                            <td>{student.name}</td>
                            <td>{student.lesson_title}</td>
                            <td>{student.pre_test_score !== null ? student.pre_test_score : '-'}</td>
                            <td className={student.post_test_score !== null ? 
                              (parseFloat(student.post_test_score) >= testInfo.passingScore ? 'high-score' : 'low-score') : ''}>
                              {student.post_test_score !== null ? student.post_test_score : '-'}
                            </td>
                            <td className={student.gain_score !== null ? 
                              (parseFloat(student.gain_score) > 0 ? 'high-score' : 
                              (parseFloat(student.gain_score) < 0 ? 'low-score' : '')) : ''}>
                              {student.gain_score !== null ? student.gain_score : '-'}
                            </td>
                            <td>{student.effectiveness_index !== null ? student.effectiveness_index : '-'}</td>
                            <td>{student.percentage_progress !== null ? `${student.percentage_progress}%` : '-'}</td>
                            <td>{student.formatted_date || student.created_at || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="no-data">ไม่พบข้อมูลนักเรียนที่ตรงกับการค้นหา</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  <div className="table-info">
                    แสดง {filteredScores.length} จาก {scores.length} รายการ
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TeacherLayout>
  );
};

export default LessonQuizDashboard;