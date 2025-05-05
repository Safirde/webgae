import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import '../styles04/ExpandableStudentTable.css';

const ExpandableStudentTable = ({ scores, testInfo, sortConfig, requestSort }) => {
  // State เก็บสถานะการขยายข้อมูลของแต่ละนักเรียน
  const [expandedStudents, setExpandedStudents] = useState({});

  // แปลงค่าคะแนนให้เป็นจำนวนเต็ม (ถ้าจำเป็น)
  const formatScore = (score) => {
    // ตรวจสอบว่าเป็นตัวเลขหรือไม่
    if (typeof score === 'number') {
      return Math.round(score);
    }
    // ถ้าเป็น string ที่แปลงเป็นตัวเลขได้
    if (!isNaN(parseFloat(score))) {
      return Math.round(parseFloat(score));
    }
    return score;
  };

  // จัดกลุ่มข้อมูลตามรหัสนักศึกษา
  const groupedScores = useMemo(() => {
    if (!Array.isArray(scores)) {
      return [];
    }

    // จัดกลุ่มข้อมูลตามรหัสนักศึกษา
    const grouped = {};
    scores.forEach(score => {
      if (!grouped[score.student_id]) {
        grouped[score.student_id] = {
          student_id: score.student_id,
          name: score.name,
          lessons: []
        };
      }
      grouped[score.student_id].lessons.push(score);
    });

    // แปลงเป็น array และคำนวณค่าเฉลี่ยและผลรวม
    const result = Object.values(grouped).map(student => {
      const totalLessons = student.lessons.length;
      
      // คำนวณค่าเฉลี่ย (เดิม)
      const avgPreTest = student.lessons.reduce((sum, lesson) => sum + lesson.pre_test_score, 0) / totalLessons;
      const avgPostTest = student.lessons.reduce((sum, lesson) => sum + lesson.post_test_score, 0) / totalLessons;
      const avgGain = student.lessons.reduce((sum, lesson) => sum + lesson.gain_score, 0) / totalLessons;
      const avgEffectivenessIndex = student.lessons.reduce((sum, lesson) => sum + parseFloat(lesson.effectiveness_index), 0) / totalLessons;
      const avgPercentageProgress = student.lessons.reduce((sum, lesson) => sum + parseFloat(lesson.percentage_progress), 0) / totalLessons;
      
      // คำนวณผลรวมคะแนน (เพิ่มใหม่)
      const totalPreTest = student.lessons.reduce((sum, lesson) => sum + lesson.pre_test_score, 0);
      const totalPostTest = student.lessons.reduce((sum, lesson) => sum + lesson.post_test_score, 0);
      const totalGain = student.lessons.reduce((sum, lesson) => sum + lesson.gain_score, 0);
      
      // หาวันที่ล่าสุด
      const latestDate = student.lessons.reduce((latest, lesson) => {
        const currentDate = new Date(lesson.formatted_date);
        return !latest || currentDate > latest ? currentDate : latest;
      }, null);
      
      return {
        ...student,
        totalLessons,
        // ค่าเฉลี่ย
        avgPreTest,
        avgPostTest,
        avgGain,
        avgEffectivenessIndex,
        avgPercentageProgress,
        // ผลรวม
        totalPreTest,
        totalPostTest,
        totalGain,
        latestDate: latestDate ? latestDate.toISOString().replace('T', ' ').substring(0, 19) : null
      };
    });

    return result;
  }, [scores]);

  // เรียงข้อมูลที่จัดกลุ่มแล้วตามการตั้งค่า
  const sortedGroupedScores = useMemo(() => {
    let sortableItems = [...groupedScores];
    
    if (sortConfig?.key) {
      sortableItems.sort((a, b) => {
        // ปรับการเปรียบเทียบสำหรับข้อมูลที่จัดกลุ่มแล้ว
        let aValue, bValue;
        
        // ตรวจสอบว่าควรใช้ค่าเฉลี่ยหรือผลรวมแทนหรือไม่
        switch(sortConfig.key) {
          case 'pre_test_score':
            aValue = a.avgPreTest;
            bValue = b.avgPreTest;
            break;
          case 'post_test_score':
            aValue = a.avgPostTest;
            bValue = b.avgPostTest;
            break;
          case 'gain_score':
            aValue = a.avgGain;
            bValue = b.avgGain;
            break;
          case 'effectiveness_index':
            aValue = a.avgEffectivenessIndex;
            bValue = b.avgEffectivenessIndex;
            break;
          case 'percentage_progress':
            aValue = a.avgPercentageProgress;
            bValue = b.avgPercentageProgress;
            break;
          case 'total_pre_test':
            aValue = a.totalPreTest;
            bValue = b.totalPreTest;
            break;
          case 'total_post_test':
            aValue = a.totalPostTest;
            bValue = b.totalPostTest;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        
        // ถ้าเป็นตัวเลข
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          }
          return bValue - aValue;
        }
        
        // ถ้าเป็นสตริง
        const aString = String(aValue || '');
        const bString = String(bValue || '');
        
        if (sortConfig.direction === 'ascending') {
          return aString.localeCompare(bString);
        }
        return bString.localeCompare(aString);
      });
    }
    
    return sortableItems;
  }, [groupedScores, sortConfig]);

  // ฟังก์ชันสำหรับเปิด/ปิดการแสดงรายละเอียดของนักเรียนแต่ละคน
  const toggleExpandStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  return (
    <div className="table-container">
      <table className="scores-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th onClick={() => requestSort('student_id')} className="sortable-header">
              รหัสนักศึกษา
              {sortConfig?.key === 'student_id' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('name')} className="sortable-header">
              ชื่อ-นามสกุล
              {sortConfig?.key === 'name' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th>จำนวนบทเรียน</th>
            
            {/* คอลัมน์คะแนนรวม */}
            <th onClick={() => requestSort('total_pre_test')} className="sortable-header">
              คะแนนก่อนเรียนรวม
              {sortConfig?.key === 'total_pre_test' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('total_post_test')} className="sortable-header">
              คะแนนหลังเรียนรวม
              {sortConfig?.key === 'total_post_test' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            
            {/* คอลัมน์ค่าเฉลี่ย */}
            <th onClick={() => requestSort('pre_test_score')} className="sortable-header">
              คะแนนก่อนเรียนเฉลี่ย
              {sortConfig?.key === 'pre_test_score' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('post_test_score')} className="sortable-header">
              คะแนนหลังเรียนเฉลี่ย
              {sortConfig?.key === 'post_test_score' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('gain_score')} className="sortable-header">
              คะแนนที่เพิ่มขึ้นเฉลี่ย
              {sortConfig?.key === 'gain_score' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('effectiveness_index')} className="sortable-header">
              ดัชนีประสิทธิผลเฉลี่ย
              {sortConfig?.key === 'effectiveness_index' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => requestSort('percentage_progress')} className="sortable-header">
              ร้อยละความก้าวหน้าเฉลี่ย
              {sortConfig?.key === 'percentage_progress' && (
                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th>วันที่ล่าสุด</th>
          </tr>
        </thead>
        <tbody>
          {sortedGroupedScores.length > 0 ? (
            sortedGroupedScores.map((student, index) => (
              <React.Fragment key={student.student_id}>
                {/* แถวหลักของนักเรียน */}
                <tr 
                  className={`expandable-row ${expandedStudents[student.student_id] ? 'expanded' : ''}`}
                  onClick={() => toggleExpandStudent(student.student_id)}
                >
                  <td>{index + 1}</td>
                  <td>
                    <div className="expandable-cell">
                      {expandedStudents[student.student_id] 
                        ? <ChevronDown size={16} className="expand-icon" /> 
                        : <ChevronRight size={16} className="expand-icon" />
                      }
                      {student.student_id}
                    </div>
                  </td>
                  <td>{student.name}</td>
                  <td>
                    {student.totalLessons} บทเรียน
                    <span className="expand-hint">
                      {expandedStudents[student.student_id] ? ' (คลิกเพื่อซ่อน)' : ' (คลิกเพื่อดู)'}
                    </span>
                  </td>
                  
                  {/* แสดงคะแนนรวม */}
                  <td className="total-score">{Math.round(student.totalPreTest)}</td>
                  <td 
                    className={`total-score ${student.totalPostTest >= (testInfo.passingScore * student.totalLessons) ? 'high-score' : 'low-score'}`}
                  >
                    {Math.round(student.totalPostTest)}</td>
                  
                  {/* แสดงค่าเฉลี่ย */}
                  <td>{student.avgPreTest.toFixed(2)}</td>
                  <td 
                    className={student.avgPostTest >= testInfo.passingScore ? 'high-score' : 'low-score'}
                  >
                    {student.avgPostTest.toFixed(2)}
                  </td>
                  <td 
                    className={student.avgGain > 0 ? 'high-score' : student.avgGain < 0 ? 'low-score' : ''}
                  >
                    {student.avgGain.toFixed(2)}
                  </td>
                  <td>{student.avgEffectivenessIndex.toFixed(3)}</td>
                  <td>{student.avgPercentageProgress.toFixed(2)}%</td>
                  <td>{student.latestDate || '-'}</td>
                </tr>
                
                {/* แถวรายละเอียดบทเรียน */}
                {expandedStudents[student.student_id] && student.lessons.map((lesson, lessonIndex) => (
                  <tr key={`${student.student_id}-${lessonIndex}`} className="detail-row">
                    <td></td>
                    <td></td>
                    <td className="lesson-title text-left">{lesson.lesson_title}</td>
                    <td></td>
                    <td>{lesson.pre_test_score}</td>
                    <td className={parseFloat(lesson.post_test_score) >= testInfo.passingScore ? 'high-score' : 'low-score'}>
                      {lesson.post_test_score}
                    </td>
                    <td></td> {/* ช่องว่างสำหรับค่าเฉลี่ยคะแนนก่อนเรียน */}
                    <td></td> {/* ช่องว่างสำหรับค่าเฉลี่ยคะแนนหลังเรียน */}
                    <td className={parseFloat(lesson.gain_score) > 0 ? 'high-score' : parseFloat(lesson.gain_score) < 0 ? 'low-score' : ''}>
                      {lesson.gain_score}
                    </td>
                    <td>{lesson.effectiveness_index}</td>
                    <td>{lesson.percentage_progress}%</td>
                    <td>{lesson.formatted_date}</td>
                  </tr>
                ))}
                
                {/* แถวสรุปเมื่อขยาย */}
                {expandedStudents[student.student_id] && (
                  <tr className="summary-row">
                    <td></td>
                    <td></td>
                    <td className="summary-title text-left">รวมทั้งหมด</td>
                    <td></td>
                    <td className="summary-cell">{Math.round(student.totalPreTest)}</td>
                    <td className={`summary-cell ${student.totalPostTest >= (testInfo.passingScore * student.totalLessons) ? 'high-score' : 'low-score'}`}>
                      {Math.round(student.totalPostTest)}</td>
                    <td></td>
                    <td></td>
                    <td className={`summary-cell ${student.totalGain > 0 ? 'high-score' : student.totalGain < 0 ? 'low-score' : ''}`}>
                      {Math.round(student.totalGain)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="12" className="no-data">ไม่พบข้อมูลนักเรียน</td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* จำนวนนักเรียนทั้งหมด */}
      <div className="results-count">
        แสดง {sortedGroupedScores.length} นักเรียน จากทั้งหมด {scores?.length || 0} รายการ
      </div>
    </div>
  );
};

export default ExpandableStudentTable;