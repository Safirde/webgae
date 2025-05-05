import React from 'react';

// This is a simplified demo of the modified quiz with blue selection
const ModifiedQuiz = () => {
  // Sample question data
  const sampleQuestion = {
    questionText: 'ข้อใดเป็นดาวเคราะห์',
    answerOptions: [
      { answerText: 'ดาวศุกร์', isCorrect: true },
      { answerText: 'ดาวอังคาร', isCorrect: false },
      { answerText: 'ดาวพุธ', isCorrect: false },
      { answerText: 'ดาวอาทิตย์', isCorrect: false },
    ]
  };
  
  // Style for demonstration
  const styles = {
    quizContainer: {
      fontFamily: 'Kanit, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    questionText: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    answerOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    answerOption: {
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center'
    },
    selected: {
      backgroundColor: '#2196F3', // Changed from green to blue
      color: 'white',
      border: '1px solid #1976D2'
    },
    notSelected: {
      backgroundColor: '#fff',
      color: '#333'
    },
    answerLetter: {
      display: 'inline-block',
      marginRight: '10px',
      fontWeight: 'bold'
    },
    progressBar: {
      height: '8px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      marginBottom: '20px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      width: '20%',
      backgroundColor: '#2196F3', // Also changed from green to blue
      borderRadius: '4px'
    },
    navButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#2196F3', // Blue button
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    progressDots: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '20px'
    },
    progressDot: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: '#e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    activeDot: {
      backgroundColor: '#2196F3', // Blue active dot
      color: 'white'
    }
  };

  return (
    <div style={styles.quizContainer}>
      <h2>แบบทดสอบ: องค์ประกอบของระบบสุริยะ</h2>
      
      <div style={styles.progressBar}>
        <div style={styles.progressFill}></div>
      </div>
      
      <div>
        <p style={styles.questionText}>1. {sampleQuestion.questionText}</p>
        <div style={styles.answerOptions}>
          {sampleQuestion.answerOptions.map((option, index) => (
            <div 
              key={index} 
              style={{
                ...styles.answerOption,
                ...(index === 0 ? styles.selected : styles.notSelected)
              }}
            >
              <span style={styles.answerLetter}>{['ก', 'ข', 'ค', 'ง'][index]}.</span> 
              {option.answerText}
            </div>
          ))}
        </div>
      </div>
      
      <div style={styles.navButtons}>
        <button style={styles.button} disabled>ข้อก่อนหน้า</button>
        <button style={styles.button}>ข้อถัดไป</button>
      </div>
      
      <div style={styles.progressDots}>
        {[1, 2, 3, 4, 5].map((num) => (
          <div 
            key={num}
            style={{
              ...styles.progressDot,
              ...(num === 1 ? styles.activeDot : {})
            }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifiedQuiz;