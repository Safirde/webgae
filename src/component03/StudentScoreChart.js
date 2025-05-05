import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, ReferenceLine
} from 'recharts';
import '../styles03/StudentScoreChart.css';

const StudentScoreChart = ({ scores, testInfo }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [groupedData, setGroupedData] = useState({
    byLesson: {},
    passingByLesson: {},
  });
  const [activeTab, setActiveTab] = useState('summary');

  // Passing threshold
  const passingScore = testInfo?.passingScore || 3;
  const maxScore = testInfo?.maxScore || 5;

  useEffect(() => {
    if (scores && scores.length > 0) {
      try {
        // Process data for charts
        processDataForCharts(scores);
        setLoading(false);
      } catch (err) {
        console.error("Error processing chart data:", err);
        setError("เกิดข้อผิดพลาดในการประมวลผลข้อมูลกราฟ");
        setLoading(false);
      }
    } else {
      // Set empty chart data
      setChartData([]);
      setGroupedData({
        byLesson: {},
        passingByLesson: {}
      });
      setLoading(false);
    }
  }, [scores, testInfo, passingScore, maxScore]);

  // Process data for various chart visualizations
  const processDataForCharts = (data) => {
    // Group data by lesson
    const byLesson = {};
    const passingByLesson = {};

    // Process each student record
    data.forEach(student => {
      const lessonTitle = student.lesson_title || 'ไม่ระบุบทเรียน';
      
      // Skip invalid data
      if (student.pre_test_score === null || student.post_test_score === null) {
        return;
      }

      // Initialize lesson data if it doesn't exist
      if (!byLesson[lessonTitle]) {
        byLesson[lessonTitle] = {
          lessonTitle,
          studentCount: 0,
          totalPreScore: 0,
          totalPostScore: 0,
          totalGainScore: 0,
          students: []
        };
        
        passingByLesson[lessonTitle] = {
          lessonTitle,
          postPassed: 0,
          postNotPassed: 0
        };
      }
      
      // Add student to lesson and update totals
      byLesson[lessonTitle].students.push(student);
      byLesson[lessonTitle].studentCount++;
      byLesson[lessonTitle].totalPreScore += student.pre_test_score;
      byLesson[lessonTitle].totalPostScore += student.post_test_score;
      byLesson[lessonTitle].totalGainScore += student.gain_score;
      
      // Count passing/not passing (only post-test)
      if (student.post_test_score >= passingScore) {
        passingByLesson[lessonTitle].postPassed++;
      } else {
        passingByLesson[lessonTitle].postNotPassed++;
      }
    });
    
    // Calculate averages for each lesson
    Object.keys(byLesson).forEach(lesson => {
      const count = byLesson[lesson].studentCount;
      if (count > 0) {
        byLesson[lesson].avgPreScore = byLesson[lesson].totalPreScore / count;
        byLesson[lesson].avgPostScore = byLesson[lesson].totalPostScore / count;
        byLesson[lesson].avgGain = byLesson[lesson].totalGainScore / count;
      }
    });
    
    // Create chart data from processed data
    const summaryData = Object.values(byLesson).map(lesson => ({
      name: lesson.lessonTitle,
      'คะแนนเฉลี่ยก่อนเรียน': parseFloat(lesson.avgPreScore.toFixed(2)),
      'คะแนนเฉลี่ยหลังเรียน': parseFloat(lesson.avgPostScore.toFixed(2)),
      'คะแนนเฉลี่ยที่เพิ่มขึ้น': parseFloat(lesson.avgGain.toFixed(2)),
      studentCount: lesson.studentCount
    }));
    
    setChartData(summaryData);
    
    // Set the grouped data with calculated values
    setGroupedData({
      byLesson,
      passingByLesson
    });
  };

  // Custom tooltip for displaying additional information in charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find lesson data for tooltip
      const lesson = Object.values(groupedData.byLesson).find(l => l.lessonTitle === label);
      const passingData = groupedData.passingByLesson[label];
      
      if (lesson) {
        return (
          <div className="custom-tooltip">
            <p className="custom-tooltip-title">{lesson.lessonTitle}</p>
            <p className="custom-tooltip-item">จำนวนนักเรียน: {lesson.studentCount} คน</p>
            <p className="custom-tooltip-item">คะแนนเฉลี่ยก่อนเรียน: {lesson.avgPreScore.toFixed(2)}</p>
            <p className="custom-tooltip-item">คะแนนเฉลี่ยหลังเรียน: {lesson.avgPostScore.toFixed(2)}</p>
            <p className="custom-tooltip-item">คะแนนเฉลี่ยที่เพิ่มขึ้น: {lesson.avgGain.toFixed(2)}</p>
            {passingData && (
              <>
                <p className="custom-tooltip-item">ผ่านเกณฑ์หลังเรียน: {passingData.postPassed} คน</p>
                <p className="custom-tooltip-item">ไม่ผ่านเกณฑ์หลังเรียน: {passingData.postNotPassed} คน</p>
              </>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Render pass/fail summary chart
  const renderPassingChart = () => {
    const passingData = Object.values(groupedData.passingByLesson);
    
    if (!passingData || passingData.length === 0) {
      return (
        <div className="summary-no-data">
          <p>ไม่มีข้อมูลจำนวนผ่าน/ไม่ผ่านเกณฑ์</p>
        </div>
      );
    }
    
    const chartData = passingData.map(item => ({
      name: item.lessonTitle,
      'ผ่านหลังเรียน': item.postPassed,
      'ไม่ผ่านหลังเรียน': item.postNotPassed
    }));
    
    return (
      <div className="passing-chart">
        <h3 className="sub-chart-title">จำนวนนักเรียนที่ผ่าน/ไม่ผ่านเกณฑ์ (หลังเรียนเท่านั้น)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={180}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="ผ่านหลังเรียน" fill="#82ca9d" />
            <Bar dataKey="ไม่ผ่านหลังเรียน" fill="#ff8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render summary chart (main overview)
  const renderSummaryChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="summary-no-data">
          <p>ไม่สามารถแสดงข้อมูลกราฟได้ในขณะนี้</p>
        </div>
      );
    }
    
    return (
      <div className="summary-overview-chart">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            barSize={35}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={0} 
              textAnchor="middle" 
              height={100}
              interval={0}
              tick={{ fontSize: 12, width: 120, wordWrap: 'break-word' }}
            />
            <YAxis 
              domain={[0, maxScore]} 
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={passingScore} stroke="#ff7300" strokeDasharray="3 3" label={{ 
              value: 'เกณฑ์ผ่าน', 
              position: 'right',
              fill: '#ff7300',
              fontSize: 12
            }} />
            <Bar dataKey="คะแนนเฉลี่ยก่อนเรียน" fill="#8884d8" />
            <Bar dataKey="คะแนนเฉลี่ยหลังเรียน" fill="#82ca9d" />
            <Bar dataKey="คะแนนเฉลี่ยที่เพิ่มขึ้น" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Navigation tabs rendering
  const renderNavTabs = () => {
    return (
      <div className="chart-tabs">
        <button 
          className={`chart-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          ภาพรวม
        </button>
        <button 
          className={`chart-tab ${activeTab === 'passing' ? 'active' : ''}`}
          onClick={() => setActiveTab('passing')}
        >
          ผ่าน/ไม่ผ่านเกณฑ์
        </button>
      </div>
    );
  };

  // Render the appropriate chart based on the active tab
  const renderActiveTabContent = () => {
    switch(activeTab) {
      case 'summary':
        return renderSummaryChart();
      case 'passing':
        return renderPassingChart();
      default:
        return renderSummaryChart();
    }
  };

  if (loading) {
    return <div className="chart-container flex justify-center items-center h-64">กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return <div className="chart-container text-red-500 text-center">เกิดข้อผิดพลาด: {error}</div>;
  }

  // If no data is available, show notification
  if (!scores || scores.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h2 className="chart-title">สรุปรายบทเรียน</h2>
        </div>
        <div className="chart-content flex justify-center items-center h-64">
          <p className="text-gray-500">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">สรุปรายบทเรียน</h2>
        {/* ลบส่วนแสดงดัชนีประสิทธิผลรวมออก */}
      </div>
      
      {renderNavTabs()}
      
      <div className="chart-content">
        {renderActiveTabContent()}
        
        <div className="chart-footer">
          แผนภูมิแสดงข้อมูลสรุปผลการเรียนรู้ตามรายบทเรียน
        </div>
      </div>
    </div>
  );
};

export default StudentScoreChart;