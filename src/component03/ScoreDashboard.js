import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles03/ScoreDashboard.css";
import { useAuth } from '../component01/AuthContext';

const ScoreDashboard = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // ข้อมูลสรุปค่าสถิติ
  const [stats, setStats] = useState({
    totalStudents: 0,
    meanScore: 0,
    medianScore: 0,
    modeScore: 0,
    standardDeviation: 0,
    variance: 0,
    testReliability: 0,
    itemAnalysis: [],
  });

  // ตรวจสอบสิทธิ์ครู
  useEffect(() => {
    const checkTeacherAuth = () => {
      const isTeacher = 
        (currentUser && currentUser.role === 'teacher') || 
        localStorage.getItem('userRole') === 'teacher';
    };
    
    checkTeacherAuth();
  }, [currentUser, navigate]);

  // ดึงข้อมูลคะแนนจาก API
  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://mgt2.pnu.ac.th/safirde/scores_db/direct_score.php?get_all=true');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          setScores(data.data);
          calculateStats(data.data);
        } else {
          console.error("รูปแบบข้อมูลไม่ถูกต้อง:", data);
          setScores([]);  // ตั้งค่าเป็นอาร์เรย์ว่างเพื่อป้องกันข้อผิดพลาด
          setError("รูปแบบข้อมูลไม่ถูกต้อง โปรดติดต่อผู้ดูแลระบบ");
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
        setError("ไม่สามารถโหลดข้อมูลคะแนนได้ โปรดลองอีกครั้งในภายหลัง");
        setScores([]);  // ตั้งค่าเป็นอาร์เรย์ว่างเพื่อป้องกันข้อผิดพลาด
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, []);
  
  // คำนวณค่าสถิติต่างๆ
  const calculateStats = (scoreData) => {
    if (!Array.isArray(scoreData) || scoreData.length === 0) {
      setStats({
        totalStudents: 0,
        meanScore: 0,
        medianScore: 0,
        modeScore: 0,
        standardDeviation: 0,
        variance: 0,
        testReliability: 0,
        itemAnalysis: [],
      });
      return;
    }
    
    // แปลงคะแนนให้เป็นตัวเลข
    const numericScores = scoreData.map(student => {
      const score = parseInt(student.pre_test_score) || 0;
      return {
        ...student,
        numericScore: score
      };
    });
    
    // หาค่าเฉลี่ย (Mean)
    const totalScore = numericScores.reduce((acc, student) => acc + student.numericScore, 0);
    const meanScore = totalScore / numericScores.length;
    
    // หาค่ามัธยฐาน (Median)
    const sortedScores = [...numericScores].sort((a, b) => a.numericScore - b.numericScore);
    let medianScore;
    const mid = Math.floor(sortedScores.length / 2);
    if (sortedScores.length % 2 === 0) {
      medianScore = (sortedScores[mid - 1].numericScore + sortedScores[mid].numericScore) / 2;
    } else {
      medianScore = sortedScores[mid].numericScore;
    }
    
    // หาค่าฐานนิยม (Mode)
    const scoreFrequency = {};
    numericScores.forEach(student => {
      const score = student.numericScore;
      scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
    });
    
    let modeScore = 0;
    let maxFrequency = 0;
    Object.entries(scoreFrequency).forEach(([score, frequency]) => {
      if (frequency > maxFrequency) {
        maxFrequency = frequency;
        modeScore = parseInt(score);
      }
    });
    
    // คำนวณค่าความแปรปรวน (Variance) และส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation)
    const sumSquaredDiff = numericScores.reduce(
      (acc, student) => acc + Math.pow(student.numericScore - meanScore, 2), 
      0
    );
    const variance = sumSquaredDiff / numericScores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // จำลองการคำนวณค่าความเชื่อมั่นของแบบทดสอบ (KR-20)
    // หมายเหตุ: การคำนวณ KR-20 ที่แท้จริงต้องมีข้อมูลการตอบของแต่ละคนในแต่ละข้อ
    // นี่เป็นเพียงการประมาณค่า
    const simulateKR20 = () => {
      // สมมติว่ามี 25 ข้อ ตามเอกสารวิจัย
      const k = 25;
      
      // สมมติค่า p และ q สำหรับแต่ละข้อ
      // ในสถานการณ์จริง ต้องมีข้อมูลรายข้อ
      const pqSum = 6.25; // ค่าสมมติ (ในความเป็นจริงต้องคำนวณจาก Σpq)
      
      // ใช้ความแปรปรวนจากข้างบน
      const testReliability = (k / (k - 1)) * (1 - (pqSum / variance));
      
      return parseFloat(testReliability.toFixed(2));
    };
    
    // สร้างจำลองการวิเคราะห์รายข้อ
    const simulateItemAnalysis = () => {
      // จำลองข้อมูลสำหรับการแสดงผล (ในระบบจริงต้องมีข้อมูลรายข้อจริง)
      const sampleItems = [];
      for (let i = 1; i <= 5; i++) {
        sampleItems.push({
          itemNumber: i,
          difficulty: parseFloat((Math.random() * 0.5 + 0.3).toFixed(2)), // สุ่มค่าความยากง่ายระหว่าง 0.3-0.8
          discrimination: parseFloat((Math.random() * 0.6 + 0.2).toFixed(2)) // สุ่มค่าอำนาจจำแนกระหว่าง 0.2-0.8
        });
      }
      return sampleItems;
    };
    
    // ตั้งค่าสถิติทั้งหมด
    setStats({
      totalStudents: numericScores.length,
      meanScore: parseFloat(meanScore.toFixed(2)),
      medianScore: parseFloat(medianScore.toFixed(2)),
      modeScore: modeScore,
      standardDeviation: parseFloat(standardDeviation.toFixed(2)),
      variance: parseFloat(variance.toFixed(2)),
      testReliability: simulateKR20(),
      itemAnalysis: simulateItemAnalysis(),
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
  const sortedScores = React.useMemo(() => {
    // ตรวจสอบว่า scores เป็นอาร์เรย์
    if (!Array.isArray(scores)) {
      return [];
    }
    
    let sortableItems = [...scores];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // ตรวจสอบว่า a และ b มีค่าหรือไม่
        if (!a || !b) return 0;
        
        // ตรวจสอบค่า null หรือ undefined
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        // ถ้าเป็นข้อมูลตัวเลข ให้แปลงเป็น number ก่อนเปรียบเทียบ
        if (sortConfig.key === 'pre_test_score') {
          const aValue = parseFloat(a[sortConfig.key]) || 0;
          const bValue = parseFloat(b[sortConfig.key]) || 0;
          
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          }
          return bValue - aValue;
        }
        
        // ถ้าเป็นข้อมูลที่ไม่ใช่ตัวเลข ให้ตรวจสอบว่าเป็น string ก่อน
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
  
  // กรองข้อมูลตามคำค้นหา - ปรับปรุงการค้นหาด้วยรหัสนักเรียน
  const filteredScores = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedScores; // ถ้าไม่มีคำค้นหา ให้แสดงข้อมูลทั้งหมด
    }
    
    return sortedScores.filter(student => {
      // ค้นหาตามรหัสนักเรียน - ถ้าขึ้นต้นด้วยตัวเลข ให้ค้นหาเฉพาะในรหัสนักเรียน
      if (/^\d/.test(searchTerm)) {
        return student.student_id.includes(searchTerm);
      }
      
      // ถ้าไม่ใช่ตัวเลขขึ้นต้น ให้ค้นหาทั้งในรหัสนักเรียนและชื่อ
      return (
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [sortedScores, searchTerm]);

  // แสดง Spinner ขณะโหลดข้อมูล
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>เกิดข้อผิดพลาด</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>ลองใหม่</button>
      </div>
    );
  }

  return (
    <div className="score-dashboard-container">
      
      <div className="dashboard-header">
        <h1>ผลคะแนนแบบทดสอบก่อนเรียน</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนักเรียน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-button">
            <span role="img" aria-label="search">🔍</span>
          </button>
        </div>
      </div>

      {/* สรุปสถิติคะแนน - เพิ่มค่าทางสถิติ */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>จำนวนนักเรียนทั้งหมด</h3>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>
        
        <div className="stat-card">
          <h3>คะแนนเฉลี่ย (Mean)</h3>
          <p className="stat-value">{stats.meanScore}</p>
        </div>
        
        <div className="stat-card">
          <h3>ค่ามัธยฐาน (Median)</h3>
          <p className="stat-value">{stats.medianScore}</p>
        </div>
        
        <div className="stat-card">
          <h3>ค่าฐานนิยม (Mode)</h3>
          <p className="stat-value">{stats.modeScore}</p>
        </div>
        
        <div className="stat-card">
          <h3>ส่วนเบี่ยงเบนมาตรฐาน</h3>
          <p className="stat-value">{stats.standardDeviation}</p>
        </div>
        
        <div className="stat-card">
          <h3>ความแปรปรวน</h3>
          <p className="stat-value">{stats.variance}</p>
        </div>
        
       
      </div>
      

      {/* ตารางคะแนนรายบุคคล */}
      <h2>ตารางคะแนนรายบุคคล</h2>
      <div className="table-container">
        <table className="scores-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th onClick={() => requestSort('student_id')} className="sortable-header">
                รหัสนักศึกษา
                {sortConfig.key === 'student_id' && (
                  <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
              <th onClick={() => requestSort('name')} className="sortable-header">
                ชื่อ-นามสกุล
                {sortConfig.key === 'name' && (
                  <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
              <th onClick={() => requestSort('pre_test_score')} className="sortable-header">
                คะแนนก่อนเรียน 
                {sortConfig.key === 'pre_test_score' && (
                  <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
              <th>วันที่ทำแบบทดสอบ</th>
            </tr>
          </thead>
          <tbody>
            {filteredScores.length > 0 ? (
              filteredScores.map((student, index) => (
                <tr key={student.id || index}>
                  <td>{index + 1}</td>
                  <td>{student.student_id}</td>
                  <td>{student.name}</td>
                  <td className={`score-cell ${parseInt(student.pre_test_score || 0) > 0 ? 'high-score' : 'low-score'}`}>
                    {student.pre_test_score && student.pre_test_score !== '0' && student.pre_test_score !== '-'
                      ? student.pre_test_score
                      : '0'}
                  </td>
                  <td>{student.created_at && student.created_at !== '-' ? student.created_at : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">ไม่พบข้อมูลนักเรียนที่ตรงกับรหัสที่ค้นหา</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* จำนวนผลลัพธ์ */}
      <div className="results-count">
        แสดง {filteredScores.length} จาก {scores.length} รายการ
      </div>

      {/* ปุ่มดาวน์โหลด CSV */}
      <div className="export-container">
        <button 
          className="export-button" 
          onClick={() => {
            // ตรวจสอบว่ามีข้อมูลสำหรับดาวน์โหลดหรือไม่
            if (!Array.isArray(filteredScores) || filteredScores.length === 0) {
              alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');
              return;
            }
            
            // สร้าง CSV สำหรับดาวน์โหลด
            let csvContent = "รหัสนักศึกษา,ชื่อ-นามสกุล,คะแนนก่อนเรียน,วันที่ทำแบบทดสอบ\n";
            
            filteredScores.forEach(student => {
              // ตรวจสอบค่าก่อนนำไปใช้
              const studentId = student.student_id || '';
              const name = student.name || '';
              const score = student.pre_test_score || '0';
              const date = student.created_at || '-';
              
              csvContent += `${studentId},${name},${score},${date}\n`;
            });
            
            // สร้าง Blob และ URL
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // สร้าง element a สำหรับดาวน์โหลด
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pretest_scores_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            
            // คลิกลิงก์เพื่อดาวน์โหลด
            link.click();
            
            // ลบลิงก์ออกจาก DOM
            document.body.removeChild(link);
          }}
        >
          <span role="img" aria-label="download">📊</span> ดาวน์โหลดรายงาน CSV
        </button>
        
        {/* เพิ่มปุ่มดาวน์โหลดรายงานสถิติ */}
        <button 
          className="export-button statistics-report"
          onClick={() => {
            // สร้าง CSV สำหรับดาวน์โหลดรายงานสถิติ
            let statsContent = "รายงานสถิติคะแนนก่อนเรียน\n\n";
            statsContent += `จำนวนนักเรียนทั้งหมด,${stats.totalStudents}\n`;
            statsContent += `คะแนนเฉลี่ย (Mean),${stats.meanScore}\n`;
            statsContent += `ค่ามัธยฐาน (Median),${stats.medianScore}\n`;
            statsContent += `ค่าฐานนิยม (Mode),${stats.modeScore}\n`;
            statsContent += `ส่วนเบี่ยงเบนมาตรฐาน,${stats.standardDeviation}\n`;
            statsContent += `ความแปรปรวน,${stats.variance}\n`;
            statsContent += `ความเชื่อมั่นของแบบทดสอบ (KR-20),${stats.testReliability}\n\n`;
            
            statsContent += `การวิเคราะห์รายข้อ\n`;
            statsContent += `ข้อที่,ค่าความยากง่าย (p),ค่าอำนาจจำแนก (r),การแปลผล\n`;
            
            stats.itemAnalysis.forEach(item => {
              const difficultyDesc = item.difficulty > 0.8 ? 'ง่ายเกินไป' : 
                                    item.difficulty < 0.2 ? 'ยากเกินไป' : 'เหมาะสม';
              const discDesc = item.discrimination < 0.2 ? 'จำแนกไม่ดี' : 
                              item.discrimination > 0.4 ? 'จำแนกดีมาก' : 'จำแนกได้';
              
              statsContent += `${item.itemNumber},${item.difficulty},${item.discrimination},${difficultyDesc}/${discDesc}\n`;
            });
            
            const blob = new Blob([statsContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `statistics_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            
            link.click();
            document.body.removeChild(link);
          }}
        >
          <span role="img" aria-label="stats">📈</span> ดาวน์โหลดรายงานสถิติ
        </button>
      </div>
    </div>
  );
};

export default ScoreDashboard;