import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import "../styles04/StudentProgressDashboard.css";
import Navbar from '../component04/Navbar';
import { useAuth } from '../component01/AuthContext';

// API URL definitions
const API_BASE_URL = "http://mgt2.pnu.ac.th/safirde";
const SCORE_API_URL = `${API_BASE_URL}/protest_score_db/score_protest_api.php`;

// Lesson data
const LESSON_DATA = [
  { id: 1, title: "องค์ประกอบของระบบสุริยะ" },
  { id: 2, title: "ลักษณะของดาวเคราะห์แต่ละดวง" },
  { id: 3, title: "ลำดับของดาวเคราะห์" },
  { id: 4, title: "การโคจรของดาวเคราะห์" },
  { id: 5, title: "ปรากฏการณ์เกี่ยวกับดวงจันทร์" }
];

const StudentProgressDashboard = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState('all');
  const [lessons] = useState(LESSON_DATA);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Student statistics state
  const [studentStats, setStudentStats] = useState({
    averagePretest: 0,
    averagePosttest: 0,
    averageGain: 0,
    effectivenessIndex: 0,
    percentageOfProgress: 0,
    lessonsPassed: 0,
    totalLessons: 0
  });

  // Test information
  const [testInfo] = useState({
    totalQuestions: 5,
    maxScore: 5,
    passingScore: 4,
  });

  // ปิดใช้งาน sidebar
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      // ปิดใช้งาน sidebar ในทุกขนาดหน้าจอ
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  // Function to toggle sidebar (ไม่ใช้แล้ว แต่ยังคงเก็บไว้เพื่อความเข้ากันได้)
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get student ID function
  const getStudentId = useCallback(() => {
    // Try to get from localStorage
    if (localStorage.getItem('studentId')) {
      return localStorage.getItem('studentId');
    } 
    // Try to get from AuthContext
    else if (currentUser && currentUser.studentId) {
      return currentUser.studentId;
    }
    
    // Try to get from URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('studentId')) {
      return params.get('studentId');
    }
    
    // Try to get from location state
    if (location.state && location.state.studentId) {
      return location.state.studentId;
    }
    
    // If studentId not found, try to get from username/email
    if (currentUser) {
      if (currentUser.email) {
        return currentUser.email.split('@')[0];
      } else if (currentUser.username) {
        return currentUser.username;
      }
    }
    
    // Check if user data exists in localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && userData.id) {
          return userData.id;
        }
      } catch (e) {
        console.error("Cannot parse user data from localStorage", e);
      }
    }
    
    return null;
  }, [currentUser, location]);

  // Logout handler
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear();
      navigate("/auth");
    }
  };

  // Check query params on first load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const lessonIdParam = queryParams.get('lesson_id');
    if (lessonIdParam) {
      setSelectedLessonId(lessonIdParam);
    }
  }, [location.search]);

  // Fetch student scores from API
  useEffect(() => {
    const fetchStudentScores = async () => {
      setLoading(true);
      
      try {
        // Get student_id 
        const id = getStudentId();
        
        if (!id) {
          throw new Error("ไม่พบข้อมูลรหัสนักเรียน");
        }
        
        // Create URL with parameters for filtering
        let url = `${SCORE_API_URL}?student_id=${id}`;
        
        if (selectedLessonId !== 'all') {
          url += `&lesson_id=${selectedLessonId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check data structure
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          // Add additional calculations for each record
          const enhancedData = data.data.map(score => {
            const preTestScore = parseFloat(score.pre_test_score) || 0;
            const postTestScore = parseFloat(score.post_test_score) || 0;
            
            // Calculate additional values
            const gainScore = postTestScore - preTestScore; // Score gain
            const gainScoreSquared = gainScore * gainScore; // D²
            const percentGain = (preTestScore !== 0) ? 
              ((postTestScore - preTestScore) / preTestScore) * 100 : 0; // Percentage gain
            
            // Calculate effectiveness index
            const maxScore = testInfo.maxScore;
            const effectivenessIndex = (preTestScore < maxScore) ? 
              (postTestScore - preTestScore) / (maxScore - preTestScore) : 0;
            
            // Calculate progress percentage
            const percentageProgress = ((postTestScore - preTestScore) / maxScore) * 100;
            
            // Pass/fail status
            const isPassed = postTestScore >= testInfo.passingScore;
            
            // Format date
            let formattedDate = score.created_at;
            try {
              if (score.created_at) {
                const date = new Date(score.created_at);
                formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
              }
            } catch (e) {
              console.error("Error formatting date:", e);
            }
            
            return {
              ...score,
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
          
          // Calculate overall student statistics
          calculateStudentStats(enhancedData);
        } else {
          console.error("Invalid data format:", data);
          setScores([]);
          setError("ไม่พบข้อมูลคะแนนของคุณ");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("ไม่สามารถโหลดข้อมูลคะแนนได้ โปรดลองอีกครั้งในภายหลัง");
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentScores();
  }, [selectedLessonId, testInfo.maxScore, testInfo.passingScore, getStudentId]);
  
  // Calculate overall student statistics
  const calculateStudentStats = (data) => {
    if (!data || data.length === 0) {
      setStudentStats({
        averagePretest: 0,
        averagePosttest: 0,
        averageGain: 0,
        effectivenessIndex: 0,
        percentageOfProgress: 0,
        lessonsPassed: 0,
        totalLessons: data.length
      });
      return;
    }
    
    // Calculate averages
    const totalPretest = data.reduce((sum, item) => sum + item.pre_test_score, 0);
    const totalPosttest = data.reduce((sum, item) => sum + item.post_test_score, 0);
    const totalGain = data.reduce((sum, item) => sum + item.gain_score, 0);
    const totalEffectivenessIndex = data.reduce((sum, item) => sum + parseFloat(item.effectiveness_index), 0);
    const totalProgress = data.reduce((sum, item) => sum + parseFloat(item.percentage_progress), 0);
    const lessonsPassed = data.filter(item => item.passed).length;
    
    setStudentStats({
      averagePretest: data.length > 0 ? totalPretest / data.length : 0,
      averagePosttest: data.length > 0 ? totalPosttest / data.length : 0,
      averageGain: data.length > 0 ? totalGain / data.length : 0,
      effectivenessIndex: data.length > 0 ? totalEffectivenessIndex / data.length : 0,
      percentageOfProgress: data.length > 0 ? totalProgress / data.length : 0,
      lessonsPassed: lessonsPassed,
      totalLessons: data.length
    });
  };

  // Show Loading Spinner
  if (loading) {
    return (
      <div>
        <Navbar activePage="progress" onLogout={handleLogout} />
        <div className={`main-content ${sidebarOpen ? 'main-content-with-sidebar' : ''}`}>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div>
        <Navbar activePage="progress" onLogout={handleLogout} />
        <div className={`main-content ${sidebarOpen ? 'main-content-with-sidebar' : ''}`}>
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">ลองใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* ซ่อน Sidebar Toggle Button */}

      {/* Navbar Component */}
      <Navbar activePage="progress" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="main-content">
        <div className="student-progress-container">
          <div className="dashboard-header">
            <h1>ความก้าวหน้าในการเรียนรู้ของฉัน</h1>
            <div className="profile-icon-container">
              <div className="user-profile">
                <span className="user-name">{currentUser?.displayName || 'นักเรียน'}</span>
                <div className="avatar-circle">
                  <span>{currentUser?.displayName?.charAt(0) || 'S'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Filter */}
          <div className="lesson-filter-container">
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

          {/* Summary Statistics - First Row */}
          <div className="stats-container">
            <div className="stat-card card-blue">
              <div className="stat-icon">📚</div>
              <h3>จำนวนบทเรียนทั้งหมด</h3>
              <p className="stat-value">{studentStats.totalLessons}</p>
            </div>
            <div className="stat-card card-orange">
              <div className="stat-icon">📝</div>
              <h3>คะแนนเฉลี่ยก่อนเรียน</h3>
              <p className="stat-value">{studentStats.averagePretest.toFixed(2)}</p>
            </div>
            <div className="stat-card card-green">
              <div className="stat-icon">📈</div>
              <h3>คะแนนเฉลี่ยหลังเรียน</h3>
              <p className="stat-value">{studentStats.averagePosttest.toFixed(2)}</p>
            </div>
            <div className="stat-card card-purple">
              <div className="stat-icon">⬆️</div>
              <h3>คะแนนที่เพิ่มขึ้นเฉลี่ย</h3>
              <p className="stat-value">{studentStats.averageGain.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Learning Efficiency - Second Row */}
          <div className="stats-container">
            <div className="stat-card card-teal">
              <div className="stat-icon">📊</div>
              <h3>ดัชนีประสิทธิผล (E.I.)</h3>
              <p className="stat-value">{studentStats.effectivenessIndex.toFixed(3)}</p>
            </div>
            <div className="stat-card card-red">
              <div className="stat-icon">🔄</div>
              <h3>ร้อยละความก้าวหน้า</h3>
              <p className="stat-value">{studentStats.percentageOfProgress.toFixed(2)}%</p>
            </div>
            <div className="stat-card card-green">
              <div className="stat-icon">✅</div>
              <h3>บทเรียนที่ผ่านเกณฑ์</h3>
              <p className="stat-value">{studentStats.lessonsPassed}/{studentStats.totalLessons}</p>
            </div>
            <div className="stat-card card-blue">
              <div className="stat-icon">🎯</div>
              <h3>ร้อยละความสำเร็จ</h3>
              <p className="stat-value">
                {studentStats.totalLessons > 0 
                  ? ((studentStats.lessonsPassed / studentStats.totalLessons) * 100).toFixed(2) 
                  : 0}%
              </p>
            </div>
          </div>

          {/* Individual Lesson Results */}
          <div className="lesson-progress-section">
            <h2>ผลการเรียนแต่ละบทเรียน</h2>
            
            {scores.length > 0 ? (
              <div className="table-container responsive-table">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th className="column-small">ลำดับ</th>
                      <th className="column-medium">บทเรียน</th>
                      <th className="column-small">คะแนนก่อนเรียน</th>
                      <th className="column-small">คะแนนหลังเรียน</th>
                      <th className="column-small">คะแนนที่เพิ่มขึ้น</th>
                      <th className="column-small">ดัชนีประสิทธิผล</th>
                      <th className="column-small">ร้อยละความก้าวหน้า</th>
                      <th className="column-small">สถานะ</th>
                      <th className="column-medium">วันที่ทำแบบทดสอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((score, index) => (
                      <tr key={`${score.id || index}-${index}`}>
                        <td className="text-center">{index + 1}</td>
                        <td>{score.lesson_title || `บทเรียนที่ ${score.lesson_id}`}</td>
                        <td className="text-center">{score.pre_test_score !== null ? score.pre_test_score : '-'}</td>
                        <td className={`text-center ${score.post_test_score !== null ? 
                          (score.post_test_score >= testInfo.passingScore ? 'high-score' : 'low-score') : ''}`}>
                          {score.post_test_score !== null ? score.post_test_score : '-'}
                        </td>
                        <td className={`text-center ${score.gain_score !== null ? 
                          (score.gain_score > 0 ? 'high-score' : 
                          (score.gain_score < 0 ? 'low-score' : '')) : ''}`}>
                          {score.gain_score !== null ? score.gain_score : '-'}
                        </td>
                        <td className="text-center">{score.effectiveness_index !== null ? score.effectiveness_index : '-'}</td>
                        <td className="text-center">{score.percentage_progress !== null ? `${score.percentage_progress}%` : '-'}</td>
                        <td className={`text-center ${score.passed ? 'status-passed' : 'status-failed'}`}>
                          {score.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </td>
                        <td>{score.formatted_date || score.created_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <p>ยังไม่มีข้อมูลคะแนนของคุณ</p>
                <p>กรุณาทำแบบทดสอบเพื่อดูความก้าวหน้าของคุณ</p>
                <Link to="/student/ARLearningPlatform" className="start-test-button">
                  ไปยังบทเรียนและแบบทดสอบ
                </Link>
              </div>
            )}
          </div>

          {/* Progress Analysis Section */}
          {scores.length > 0 && (
            <div className="progress-analysis-section">
              <h2>วิเคราะห์ความก้าวหน้าการเรียนรู้</h2>
              
              <div className="analysis-cards">
                <div className="analysis-card card-blue">
                  <div className="card-header">
                    <div className="header-icon">🧠</div>
                    <h3>ความเข้าใจเนื้อหา</h3>
                  </div>
                  <div className="progress-meter">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${Math.min(studentStats.averagePosttest / testInfo.maxScore * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="analysis-result">{getPerformanceLabel(studentStats.averagePosttest / testInfo.maxScore * 100)}</p>
                </div>
                
                <div className="analysis-card card-green">
                  <div className="card-header">
                    <div className="header-icon">📈</div>
                    <h3>พัฒนาการการเรียนรู้</h3>
                  </div>
                  <div className="progress-meter">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${Math.min(Math.max(studentStats.percentageOfProgress, 0), 100)}%` }}
                    ></div>
                  </div>
                  <p className="analysis-result">{getLearningProgressLabel(studentStats.percentageOfProgress)}</p>
                </div>
                
                <div className="analysis-card card-orange">
                  <div className="card-header">
                    <div className="header-icon">🏆</div>
                    <h3>ความสำเร็จในการเรียน</h3>
                  </div>
                  <div className="progress-meter">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${studentStats.totalLessons > 0 
                          ? Math.min((studentStats.lessonsPassed / studentStats.totalLessons) * 100, 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="analysis-result">{getSuccessLabel(studentStats.lessonsPassed, studentStats.totalLessons)}</p>
                </div>
              </div>

              <div className="recommendation-box">
                <div className="recommendation-header">
                  <div className="header-icon">💡</div>
                  <h3>คำแนะนำสำหรับคุณ</h3>
                </div>
                <p className="recommendation-text">{generateRecommendation(studentStats, scores)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for analysis and recommendations
function getPerformanceLabel(percentage) {
  if (percentage >= 80) return "ดีเยี่ยม - คุณเข้าใจเนื้อหาได้อย่างดี";
  if (percentage >= 70) return "ดี - คุณเข้าใจเนื้อหาส่วนใหญ่";
  if (percentage >= 60) return "ปานกลาง - คุณเข้าใจเนื้อหาพื้นฐาน";
  if (percentage >= 50) return "พอใช้ - คุณยังต้องทบทวนเนื้อหาเพิ่มเติม";
  return "ต้องปรับปรุง - คุณควรทบทวนเนื้อหาอย่างจริงจัง";
}

function getLearningProgressLabel(percentage) {
  if (percentage >= 50) return "ดีมาก - คุณมีพัฒนาการที่โดดเด่น";
  if (percentage >= 30) return "ดี - คุณมีพัฒนาการที่ชัดเจน";
  if (percentage >= 20) return "ปานกลาง - คุณมีพัฒนาการที่พอใช้";
  if (percentage >= 10) return "พอใช้ - คุณมีพัฒนาการเล็กน้อย";
  if (percentage >= 0) return "ต้องปรับปรุง - คุณยังไม่มีพัฒนาการที่ชัดเจน";
  return "ถอยหลัง - คะแนนหลังเรียนต่ำกว่าก่อนเรียน ควรทบทวนอีกครั้ง";
}

function getSuccessLabel(passed, total) {
  if (total === 0) return "ยังไม่มีข้อมูล";
  
  const percentage = (passed / total) * 100;
  
  if (percentage >= 80) return "ยอดเยี่ยม - คุณผ่านเกณฑ์เกือบทุกบทเรียน";
  if (percentage >= 60) return "ดี - คุณผ่านเกณฑ์ส่วนใหญ่";
  if (percentage >= 40) return "ปานกลาง - คุณผ่านเกณฑ์บางบทเรียน";
  if (percentage > 0) return "เริ่มต้น - คุณยังมีบทเรียนที่ต้องพัฒนาอีกมาก";
  return "ยังไม่ผ่านเกณฑ์ - คุณควรกลับไปทบทวนและทำแบบทดสอบอีกครั้ง";
}

function generateRecommendation(stats, scores) {
  // If no data
  if (scores.length === 0) {
    return "เริ่มทำแบบทดสอบเพื่อดูความก้าวหน้าของคุณ";
  }

  // Check for failed lessons
  const failedLessons = scores.filter(score => !score.passed);
  
  if (stats.averagePosttest < 3) {
    return `คุณควรทบทวนเนื้อหาทั้งหมดอีกครั้ง โดยเฉพาะ${failedLessons.length > 0 ? 'บทเรียน ' + failedLessons.map(l => l.lesson_title || `บทที่ ${l.lesson_id}`).join(', ') : 'ทุกบทเรียน'} และลองทำแบบทดสอบอีกครั้ง`;
  }
  
  if (failedLessons.length > 0) {
    return `คุณควรทบทวนบทเรียน ${failedLessons.map(l => l.lesson_title || `บทที่ ${l.lesson_id}`).join(', ')} เพื่อพัฒนาความเข้าใจและผ่านเกณฑ์การประเมิน`;
  }
  
  if (stats.averagePosttest >= 4.5) {
    return "ยอดเยี่ยมมาก! คุณมีความเข้าใจในเนื้อหาอย่างดีเยี่ยม คุณสามารถศึกษาเนื้อหาขั้นสูงต่อไปได้";
  }
  
  return "คุณกำลังทำได้ดี แต่ยังมีโอกาสในการพัฒนาเพิ่มเติม ลองทบทวนเนื้อหาและทำแบบทดสอบอีกครั้งเพื่อปรับปรุงคะแนน";
}

export default StudentProgressDashboard;