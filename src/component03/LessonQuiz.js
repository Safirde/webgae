import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../component01/AuthContext';
import SimpleProfileIcon from '../ProfileAllUser/SimpleProfileIcon';
import '../styles03/LessonQuiz.css';

// API URLs
const LESSONS_API_URL = "http://mgt2.pnu.ac.th/safirde/lessons_db/lessons_api.php";
const PRETEST_SCORES_API_URL = "http://mgt2.pnu.ac.th/safirde/protest_score_db/score_protest_api.php";
const BACKUP_PRETEST_API_URL = "http://mgt2.pnu.ac.th/safirde/protest_score_db/score_api.php";
const BACKUP_SCORES_API_URL = "http://mgt2.pnu.ac.th/safirde/scores_db/score_api.php";

// Function to create timeout signal
function createTimeoutSignal(timeout) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(timeout);
  }
  
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }
  
  return undefined;
}

// Function for shuffling questions
const shuffleQuestions = (questions) => {
  const shuffledQuestions = [...questions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }
  return shuffledQuestions;
};

// Function for shuffling answer options
const shuffleAnswerOptions = (question) => {
  const newQuestion = { ...question };
  const shuffledOptions = [...question.answerOptions];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  newQuestion.answerOptions = shuffledOptions;
  return newQuestion;
};

// Function for randomizing quiz data
const getRandomizedQuizData = (quizData) => {
  if (!quizData || !quizData.questions || quizData.questions.length === 0) return quizData;
  
  const originalQuestions = JSON.parse(JSON.stringify(quizData.questions));
  const randomizedData = { ...quizData };
  randomizedData.questions = shuffleQuestions(quizData.questions).map(shuffleAnswerOptions);
  randomizedData.originalQuestions = originalQuestions;
  
  return randomizedData;
};

// CSS สำหรับข้อความแจ้งเตือน
const notificationStyles = `
html, body {
  height: auto !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  position: relative !important;
}

#root, .container, .quiz-container, .result-container {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

.save-message, .success-message, .error-message, .warning-message, .info-message, .critical-error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  padding: 15px 20px;
  border-radius: 5px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease;
  display: flex;
  align-items: center;
}

.save-message {
  background-color: #e3f2fd;
  color: #0d47a1;
  border-left: 4px solid #1976d2;
}

.success-message {
  background-color: #e8f5e9;
  color: #1b5e20;
  border-left: 4px solid #2e7d32;
}

.error-message {
  background-color: #ffebee;
  color: #b71c1c;
  border-left: 4px solid #c62828;
}

.warning-message {
  background-color: #fff8e1;
  color: #ff6f00;
  border-left: 4px solid #ff8f00;
}

.info-message {
  background-color: #e8eaf6;
  color: #3f51b5;
  border-left: 4px solid #3f51b5;
}

.critical-error-message {
  background-color: #ffebee;
  color: #b71c1c;
  border-left: 4px solid #c62828;
  flex-direction: column;
  align-items: flex-start;
}

.critical-error-message button {
  margin-top: 10px;
  padding: 5px 15px;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.critical-error-message button:hover {
  background-color: #b71c1c;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.result-container {
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
  overflow: visible !important;
  max-height: none !important;
}

.correct-answers-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: visible !important;
  max-height: none !important;
}

.correct-answers-section h3 {
  display: flex;
  align-items: center;
  color: #2c3e50;
  margin-bottom: 15px;
}

.correct-answers-section h3 i {
  margin-right: 10px;
  color: #27ae60;
}

.score-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.correct-summary, .incorrect-summary {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.correct-summary {
  color: #27ae60;
}

.correct-summary i {
  margin-right: 8px;
  color: #27ae60;
}

.incorrect-summary {
  color: #e74c3c;
}

.incorrect-summary i {
  margin-right: 8px;
  color: #e74c3c;
}

.question-answer-item {
  margin-bottom: 25px;
  padding: 15px;
  border-radius: 8px;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.question-answer-item.correct-item {
  background-color: rgba(46, 204, 113, 0.05);
  border-left: 4px solid #2ecc71;
}

.question-answer-item.incorrect-item {
  background-color: rgba(231, 76, 60, 0.05);
  border-left: 4px solid #e74c3c;
}

.question-answer-item:last-child {
  border-bottom: none;
}

.quiz-question {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
}

.question-number-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
  font-weight: bold;
  color: white;
}

.question-number-badge.correct-badge {
  background-color: #2ecc71;
}

.question-number-badge.incorrect-badge {
  background-color: #e74c3c;
}

.user-result-badge {
  margin-left: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.user-result-badge.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.user-result-badge.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.user-result-badge i {
  margin-right: 5px;
}

.answers-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 35px;
}

.quiz-answer {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f5f5;
  position: relative;
  border-left: 4px solid transparent;
}

.quiz-answer.correct-selected {
  background-color: rgba(46, 204, 113, 0.15);
  border-left: 4px solid #2ecc71;
}

.quiz-answer.incorrect-selected {
  background-color: rgba(231, 76, 60, 0.15);
  border-left: 4px solid #e74c3c;
}

.quiz-answer.correct-not-selected {
  background-color: rgba(46, 204, 113, 0.05);
  border: 1px dashed #2ecc71;
}

.answer-letter {
  width: 25px;
  height: 25px;
  background-color: #bdc3c7;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: bold;
}

.answer-letter.correct-letter {
  background-color: #2ecc71;
}

.answer-text {
  flex-grow: 1;
}

.answer-badge {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 10px;
  white-space: nowrap;
}

.answer-badge.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.answer-badge.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.answer-badge i {
  margin-right: 5px;
}

.correction-message {
  margin: 10px 0 15px 35px;
  padding: 8px 12px;
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 14px;
  color: #ff6f00;
}

.correction-message i {
  margin-right: 8px;
}

.answer-explanation {
  margin-top: 15px;
  padding: 15px;
  background-color: #f1f8e9;
  border-radius: 4px;
  margin-left: 35px;
}

.explanation-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-bottom: 10px;
  color: #33691e;
}

.explanation-header i {
  margin-right: 8px;
}
`;

// ฟังก์ชันจัดการการแสดงข้อความแจ้งเตือน
const showNotification = (type, message, duration = 3000) => {
  const existingNotifications = document.querySelectorAll('.save-message, .success-message, .error-message, .warning-message, .info-message, .critical-error-message');
  existingNotifications.forEach(notification => {
    try {
      document.body.removeChild(notification);
    } catch (e) {}
  });
  
  const notification = document.createElement('div');
  notification.className = `${type}-message`;
  notification.innerHTML = `<p>${message}</p>`;
  
  if (type === 'save') {
    notification.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
  } else if (type === 'success') {
    notification.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 10px;"></i><p>${message}</p>`;
  } else if (type === 'error' || type === 'critical-error') {
    notification.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i><p>${message}</p>`;
  } else if (type === 'warning') {
    notification.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i><p>${message}</p>`;
  } else if (type === 'info') {
    notification.innerHTML = `<i class="fas fa-info-circle" style="margin-right: 10px;"></i><p>${message}</p>`;
  }
  
  document.body.appendChild(notification);
  
  if (type !== 'critical-error' && duration > 0) {
    setTimeout(() => {
      try {
        document.body.removeChild(notification);
      } catch (e) {}
    }, duration);
  }
  
  return notification;
};

const LessonQuiz = ({ 
  lessonId, 
  quizData = null, 
  onClose, 
  onComplete = null,
  isPreLesson = false
}) => {
  const isPreTest = isPreLesson; 
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const { currentUser } = useAuth();
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [pretestScore, setPretestScore] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [nextLessonInfo, setNextLessonInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [quizState, setQuizState] = useState(null);

  // เพิ่มฟังก์ชันแก้ไขปัญหาการเลื่อน (scrolling)
  const fixScrolling = useCallback(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100%';
    
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
      quizContainer.style.overflow = 'visible';
      quizContainer.style.maxHeight = 'none';
    }
    
    const resultContainer = document.querySelector('.result-container');
    if (resultContainer) {
      resultContainer.style.overflow = 'visible';
      resultContainer.style.maxHeight = 'none';
    }

    const answersSection = document.querySelector('.correct-answers-section');
    if (answersSection) {
      answersSection.style.overflow = 'visible';
      answersSection.style.maxHeight = 'none';
    }
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
        el.style.overflow = 'visible';
        el.style.overflowY = 'visible';
      }
    });
  }, []);

  // เพิ่ม CSS styles เมื่อ component ถูกโหลด
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = notificationStyles;
    document.head.appendChild(styleElement);
    
    fixScrolling();
    
    const scrollTimer = setTimeout(() => {
      fixScrolling();
    }, 1000);
    
    return () => {
      try {
        document.head.removeChild(styleElement);
        clearTimeout(scrollTimer);
      } catch (e) {}
    };
  }, [fixScrolling]);

  // Get student ID from various sources
  const getStudentId = useCallback(() => {
    if (currentUser && currentUser.studentId) {
      return currentUser.studentId;
    }
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('studentId')) {
      return params.get('studentId');
    }
    
    if (location.state && location.state.studentId) {
      return location.state.studentId;
    }
    
    if (currentUser) {
      if (currentUser.email) {
        return currentUser.email.split('@')[0];
      } else if (currentUser.username) {
        return currentUser.username;
      }
    }
    
    return null;
  }, [currentUser, location]);

  // ฟังก์ชันคำนวณคะแนนที่แก้ไขแล้ว
  const calculateScore = useCallback(() => {
    if (!questions || questions.length === 0) return 0;
    
    let score = 0;
    
    // Debug log
    console.log('Calculating score:');
    console.log('Questions:', questions);
    console.log('Selected answers:', selectedAnswers);
    
    for (let i = 0; i < questions.length; i++) {
      const selectedIndex = selectedAnswers[i];
      
      // ตรวจสอบความถูกต้องของข้อมูลก่อนการใช้งาน
      if (selectedIndex === null || selectedIndex === undefined) {
        console.log(`Question ${i + 1}: No answer selected`);
        continue;
      }
      
      if (!questions[i] || !questions[i].answerOptions) {
        console.log(`Question ${i + 1}: Invalid question or no answer options`);
        continue;
      }
      
      if (!questions[i].answerOptions[selectedIndex]) {
        console.log(`Question ${i + 1}: Invalid selected answer index: ${selectedIndex}`);
        continue;
      }
      
      const isCorrect = questions[i].answerOptions[selectedIndex].isCorrect;
      
      // Debug log
      console.log(`Question ${i + 1}:`, {
        selected: selectedIndex,
        answer: questions[i].answerOptions[selectedIndex],
        isCorrect: isCorrect
      });
      
      if (isCorrect) {
        score++;
      }
    }
    
    console.log('Final score:', score);
    return score;
  }, [questions, selectedAnswers]);

  // ตรวจสอบข้อมูลบทเรียนถัดไป
  const checkNextLesson = useCallback(async () => {
    if (!lessonId) return;
    
    try {
      const response = await fetch(`${LESSONS_API_URL}/lessons`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
          const sortedLessons = result.data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          
          const currentLessonIndex = sortedLessons.findIndex(
            lesson => parseInt(lesson.id) === parseInt(lessonId)
          );
          
          if (currentLessonIndex !== -1 && currentLessonIndex < sortedLessons.length - 1) {
            const nextLesson = sortedLessons[currentLessonIndex + 1];
            setNextLessonInfo(nextLesson);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching lessons for next lesson check:", error);
    }
  }, [lessonId]);

  // Fetch pretest score
  const fetchPretestScore = useCallback(async (studentId, lessonTitle) => {
    if (!studentId || !lessonTitle) return null;
    
    try {
      const response = await fetch(`${PRETEST_SCORES_API_URL}?student_id=${studentId}&lesson_title=${encodeURIComponent(lessonTitle)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          const lessonData = Array.isArray(data.data) ? 
            data.data.find(item => item.lesson_title === lessonTitle) : 
            (data.data.lesson_title === lessonTitle ? data.data : null);
          
          if (lessonData && lessonData.pre_test_score !== undefined) {
            console.log("Successfully fetched pretest score:", lessonData.pre_test_score);
            return parseInt(lessonData.pre_test_score);
          }
        }
        
        console.warn("Pretest score not found:", data);
        return null;
      } else {
        console.warn("Cannot fetch pretest score data:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching pretest score:", error);
      return null;
    }
  }, []);

  // Fetch previous post-test attempt
  const fetchPreviousAttempt = useCallback(async (studentId, lessonId, lessonTitle, isPreLesson = false) => {
    if (!studentId || !lessonTitle) return null;
    
    try {
      const apiUrl = isPreLesson ? PRETEST_SCORES_API_URL : BACKUP_SCORES_API_URL;
      
      const response = await fetch(`${apiUrl}?student_id=${studentId}&lesson_title=${encodeURIComponent(lessonTitle)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          let lessonData;
          if (Array.isArray(data.data)) {
            lessonData = data.data.find(item => 
              item.lesson_title === lessonTitle || parseInt(item.lesson_id) === parseInt(lessonId)
            );
          } else if (data.data.lesson_title === lessonTitle || parseInt(data.data.lesson_id) === parseInt(lessonId)) {
            lessonData = data.data;
          }
          
          if (lessonData) {
            const scoreField = isPreLesson ? 'pre_test_score' : 'post_test_score';
            
            if (lessonData[scoreField] !== undefined) {
              console.log(`Found previous ${isPreLesson ? 'pre-test' : 'post-test'} score:`, lessonData[scoreField]);
              return {
                score: parseInt(lessonData[scoreField]),
                timestamp: lessonData.updated_at || lessonData.created_at,
                passed: parseInt(lessonData[scoreField]) >= 4
              };
            }
          }
        }
        
        return null;
      } else {
        console.warn("Cannot fetch previous attempt data:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching previous attempt:", error);
      return null;
    }
  }, []);

  // Initialize component and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const sid = getStudentId();
        setStudentId(sid);
        
        let quizTitle = '';
        
        if (quizData && quizData.questions && quizData.questions.length > 0) {
          setOriginalQuestions(JSON.parse(JSON.stringify(quizData.questions)));
          
          const nonRandomizedQuizData = { ...quizData };
          setQuestions(nonRandomizedQuizData.questions);
          setSelectedAnswers(Array(nonRandomizedQuizData.questions.length).fill(null));
          
          quizTitle = quizData.lessonTitle || '';
          setLessonTitle(quizTitle);
          
          if (sid) {
            if (!isPreLesson) {
              const preScore = await fetchPretestScore(sid, quizTitle);
              setPretestScore(preScore);
            }
            
            const previousScore = await fetchPreviousAttempt(sid, quizData.lessonId, quizTitle, isPreLesson);
            setPreviousAttempt(previousScore);
          }
          
          const calculatedTime = Math.max(nonRandomizedQuizData.questions.length * 60, 300);
          setTimeLeft(calculatedTime);
          
          await checkNextLesson();
          
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${LESSONS_API_URL}/lessons/${lessonId}`);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'success' && result.data) {
              const lessonData = result.data;
              quizTitle = lessonData.title || '';
              setLessonTitle(quizTitle);
              
              if (sid) {
                if (!isPreLesson) {
                  const preScore = await fetchPretestScore(sid, quizTitle);
                  setPretestScore(preScore);
                }
                
                const previousScore = await fetchPreviousAttempt(sid, lessonId, quizTitle, isPreLesson);
                setPreviousAttempt(previousScore);
              }
              
              const questionSet = isPreLesson ? 
                (lessonData.preLessonQuiz || []) : 
                (lessonData.questions || []);
              
              if (questionSet.length > 0) {
                setOriginalQuestions(JSON.parse(JSON.stringify(questionSet)));
                
                setQuestions(questionSet);
                setSelectedAnswers(Array(questionSet.length).fill(null));
                
                const calculatedTime = Math.max(questionSet.length * 60, 300);
                setTimeLeft(calculatedTime);
                
                await checkNextLesson();
                
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError) {
          console.warn("Cannot fetch data from API:", apiError);
        }

        let defaultQuestions = [
          {
            questionText: `ไม่พบคำถามสำหรับ${isPreLesson ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'}นี้ กรุณาติดต่อผู้สอน`,
            answerOptions: [
              { answerText: 'ทราบแล้ว', isCorrect: true },
              { answerText: 'ไม่สามารถทำแบบทดสอบได้', isCorrect: false },
            ],
          }
        ];

        setOriginalQuestions(JSON.parse(JSON.stringify(defaultQuestions)));
        setQuestions(defaultQuestions);
        setSelectedAnswers(Array(defaultQuestions.length).fill(null));
        setTimeLeft(300);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + err.message);
      }
    };

    loadData();
  }, [lessonId, quizData, getStudentId, fetchPretestScore, fetchPreviousAttempt, isPreLesson, checkNextLesson]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || showScore) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          alert("หมดเวลาทำแบบทดสอบ");
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showScore]);
  
  // Check if all questions are answered
  useEffect(() => {
    const checkAllAnsweredEffect = () => {
      const answered = selectedAnswers.every(answer => answer !== null);
      setAllQuestionsAnswered(answered);
    };
    
    checkAllAnsweredEffect();
  }, [selectedAnswers]);

  // ฟังก์ชันบันทึกคะแนนลง localStorage - จะถูกเปลี่ยนให้ไม่ทำอะไร
  const saveScoreToLocalStorage = useCallback((score) => {
    console.log(`ข้ามการบันทึกคะแนน ${score} ลง localStorage`);
    return true;
  }, [isPreLesson, lessonId]);

  // ฟังก์ชันส่งคะแนนไปยัง API ที่ปรับปรุงใหม่
  const sendScoreToApi = useCallback(async (apiUrl, scoreData, timeout = 10000) => {
    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      };
      
      const signal = createTimeoutSignal(timeout);
      if (signal) {
        fetchOptions.signal = signal;
      }
      
      const response = await fetch(apiUrl, fetchOptions);
      
      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        return { 
          success: false, 
          error: `API responded with status: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Request failed: ${error.message}` 
      };
    }
  }, []);

  // ฟังก์ชันส่งคะแนนไปยัง API แบบฟอร์มดาต้า
  const sendScoreToApiAsFormData = useCallback(async (apiUrl, scoreData, timeout = 10000) => {
    try {
      const formData = new URLSearchParams();
      for (const key in scoreData) {
        formData.append(key, scoreData[key]);
      }
      
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      };
      
      const signal = createTimeoutSignal(timeout);
      if (signal) {
        fetchOptions.signal = signal;
      }
      
      const response = await fetch(apiUrl, fetchOptions);
      
      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        return { 
          success: false, 
          error: `API responded with status: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Form data request failed: ${error.message}` 
      };
    }
  }, []);

  // Updated sendScoreToBackend function
  const sendScoreToBackend = useCallback(async (score) => {
    let sid = studentId || getStudentId();
    let fullName = '';
    
    try {
      if (currentUser) {
        if (currentUser.displayName) {
          fullName = currentUser.displayName;
        } else if (currentUser.firstName || currentUser.lastName) {
          fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        }
      }
      
      if (!fullName) {
        fullName = sid;
      }
      
      if (!sid) {
        sid = 'temp_' + new Date().getTime();
        console.warn("Student ID not found, using temporary ID:", sid);
      }
      
      showNotification('save', 'กำลังบันทึกคะแนน...', 0);
      
      const primaryApiUrl = isPreLesson ? PRETEST_SCORES_API_URL : BACKUP_SCORES_API_URL;
      const backupApiUrl = isPreLesson ? BACKUP_PRETEST_API_URL : BACKUP_SCORES_API_URL;
      
      const scoreData = {
        student_id: sid,
        name: fullName,
        lesson_id: lessonId,
        lesson_title: lessonTitle
      };
      
      if (isPreLesson) {
        scoreData.pre_test_score = score;
      } else {
        scoreData.post_test_score = score;
        if (pretestScore !== null) {
          scoreData.pre_test_score = pretestScore;
        }
      }
      
      console.log("ส่งข้อมูลคะแนนไปยัง API:", primaryApiUrl, scoreData);
      
      let savedSuccessfully = false;
      let responseData = null;
      
      const jsonResult = await sendScoreToApi(primaryApiUrl, scoreData);
      if (jsonResult.success) {
        savedSuccessfully = true;
        responseData = jsonResult.data;
        console.log(`บันทึกคะแนน ${isPreLesson ? 'ก่อนเรียน' : 'หลังเรียน'} ด้วย JSON สำเร็จ:`, responseData);
      } else {
        console.warn("JSON request failed:", jsonResult.error);
        
        const formResult = await sendScoreToApiAsFormData(primaryApiUrl, scoreData);
        if (formResult.success) {
          savedSuccessfully = true;
          responseData = formResult.data;
          console.log(`บันทึกคะแนน ${isPreLesson ? 'ก่อนเรียน' : 'หลังเรียน'} ด้วย Form data สำเร็จ:`, responseData);
        } else {
          console.warn("Form data request failed:", formResult.error);
          
          const backupResult = await sendScoreToApi(backupApiUrl, scoreData);
          if (backupResult.success) {
            savedSuccessfully = true;
            responseData = backupResult.data;
            console.log(`บันทึกคะแนน ${isPreLesson ? 'ก่อนเรียน' : 'หลังเรียน'} ด้วย API สำรอง สำเร็จ:`, responseData);
          } else {
            console.error("All API attempts failed");
            
            const fallbackApiUrl = isPreLesson ? BACKUP_SCORES_API_URL : PRETEST_SCORES_API_URL;
            const fallbackResult = await sendScoreToApi(fallbackApiUrl, scoreData);
            if (fallbackResult.success) {
              savedSuccessfully = true;
              responseData = fallbackResult.data;
              console.log(`บันทึกคะแนน ${isPreLesson ? 'ก่อนเรียน' : 'หลังเรียน'} ด้วย Fallback API สำเร็จ:`, responseData);
            }
          }
        }
      }
      
      const loadingMsgs = document.querySelectorAll('.save-message');
      loadingMsgs.forEach(msg => {
        try {
          document.body.removeChild(msg);
        } catch (e) {}
      });
      
      if (savedSuccessfully) {
        showNotification('success', 'บันทึกคะแนนสำเร็จ', 2000);
        
        if (onComplete) {
          onComplete(lessonId, score, isPreLesson);
        }
        return { success: true, data: responseData };
      } else {
        showNotification('warning', `ไม่สามารถบันทึกข้อมูลไปยังเซิร์ฟเวอร์ได้`, 5000);
        
        setTimeout(() => {
          console.log("พยายามบันทึกข้อมูลอีกครั้งในเบื้องหลัง...");
          sendScoreToApi(primaryApiUrl, scoreData)
            .then(result => {
              if (result.success) {
                console.log("การบันทึกข้อมูลในเบื้องหลังสำเร็จ");
              } else {
                console.warn("การบันทึกข้อมูลในเบื้องหลังล้มเหลว");
              }
            })
            .catch(error => console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลในเบื้องหลัง:", error));
        }, 5000);
        
        if (onComplete) {
          onComplete(lessonId, score, isPreLesson);
        }
        return { success: false };
      }
    } catch (mainError) {
      console.error("เกิดข้อผิดพลาดหลักในการบันทึกคะแนน:", mainError);
      
      const loadingMsgs = document.querySelectorAll('.save-message');
      loadingMsgs.forEach(msg => {
        try {
          document.body.removeChild(msg);
        } catch (e) {}
      });
      
      showNotification('error', `เกิดข้อผิดพลาดในการบันทึกคะแนน`, 5000);
      
      if (onComplete) {
        onComplete(lessonId, score, isPreLesson);
      }
      return { success: false, error: mainError.message };
    }
  }, [currentUser, lessonId, lessonTitle, pretestScore, getStudentId, studentId, onComplete, isPreLesson, sendScoreToApi, sendScoreToApiAsFormData]);

  // Add a force update function
  const forceUpdate = useCallback(() => {
    const randomValue = Math.random();
    setShowResults(false);
    setTimeout(() => {
      setShowResults(true);
    }, 50);
  }, []);

  // Submit quiz
  const handleSubmit = () => {
    const unansweredQuestions = selectedAnswers.filter(answer => answer === null).length;

    if (unansweredQuestions > 0) {
      const confirm = window.confirm(`ยังมีคำถามที่ยังไม่ได้ตอบ ${unansweredQuestions} ข้อ ต้องการส่งคำตอบหรือไม่?`);
      if (!confirm) return;
    }

    // Create local copies of the current state to ensure they aren't modified by async operations
    const finalQuestions = JSON.parse(JSON.stringify(questions));
    const finalSelectedAnswers = [...selectedAnswers];
    
    // Log the answers and questions
    console.log("SUBMIT - Questions:", finalQuestions);
    console.log("SUBMIT - Selected answers:", finalSelectedAnswers);
    
    // Calculate score based on the final copies
    let calculatedScore = 0;
    let correctAnswers = [];
    
    for (let i = 0; i < finalQuestions.length; i++) {
      const selectedIndex = finalSelectedAnswers[i];
      if (selectedIndex !== null && selectedIndex !== undefined &&
          finalQuestions[i] && finalQuestions[i].answerOptions && 
          finalQuestions[i].answerOptions[selectedIndex] && 
          finalQuestions[i].answerOptions[selectedIndex].isCorrect) {
        calculatedScore++;
        correctAnswers.push(i);
      }
    }
    
    console.log("SUBMIT - Calculated score:", calculatedScore);
    console.log("SUBMIT - Correct answers:", correctAnswers);
    
    // Store these values in component state
    setScore(calculatedScore);
    
    // Create a special object to store quiz state for result display
    const quizResultState = {
      questions: finalQuestions,
      selectedAnswers: finalSelectedAnswers,
      score: calculatedScore,
      correctAnswers: correctAnswers
    };
    
    // Store the quiz state in localStorage as a fallback
    try {
      localStorage.setItem('lastQuizState', JSON.stringify(quizResultState));
    } catch (e) {
      console.warn("Could not save quiz state to localStorage:", e);
    }
    
    // Update component state with quiz result
    setQuizState(quizResultState);
    
    // Also store in window for backward compatibility
    window.quizResultState = quizResultState;
    
    setIsSubmitted(true);
    setShowScore(true);
    setShowResults(true);

    showNotification('save', 'กำลังบันทึกคะแนน...', 0);

    setTimeout(() => {
      fixScrolling();
    }, 300);

    sendScoreToBackend(calculatedScore)
      .then(result => {
        const loadingMsgs = document.querySelectorAll('.save-message');
        loadingMsgs.forEach(msg => {
          try {
            document.body.removeChild(msg);
          } catch (e) {}
        });
        
        if (!result || !result.success) {
          if (retryCount < 2) {
            setRetryCount(count => count + 1);
            setTimeout(() => {
              showNotification('info', 'กำลังลองบันทึกข้อมูลอีกครั้ง...', 2000);
              sendScoreToBackend(calculatedScore);
            }, 3000);
          } else {
            console.warn("ไม่สามารถบันทึกคะแนนลงฐานข้อมูลได้หลังจากพยายามหลายครั้ง");
          }
        }
        
        setTimeout(fixScrolling, 500);
      })
      .catch(error => {
        const loadingMsgs = document.querySelectorAll('.save-message');
        loadingMsgs.forEach(msg => {
          try {
            document.body.removeChild(msg);
          } catch (e) {}
        });
        
        console.error("เกิดข้อผิดพลาดในการส่งคะแนน:", error);
        
        const errorNotification = showNotification('critical-error', 
          `เกิดข้อผิดพลาดในการบันทึกคะแนน (${calculatedScore})`, 
          0
        );
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'ลองบันทึกอีกครั้ง';
        retryButton.onclick = () => {
          try {
            document.body.removeChild(errorNotification);
          } catch (e) {}
          
          sendScoreToBackend(calculatedScore);
        };
        
        errorNotification.appendChild(retryButton);
        
        setTimeout(() => {
          try {
            if (document.body.contains(errorNotification)) {
              document.body.removeChild(errorNotification);
            }
          } catch (e) {}
        }, 10000);
        
        setTimeout(fixScrolling, 500);
      });
  };

  // Function to check if all questions are answered
  const checkAllAnswered = () => {
    return selectedAnswers.every(answer => answer !== undefined);
  };

  // Select an answer
  const handleAnswerOptionClick = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  // Move to next question
  const handleNextQuestion = () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowScore(true);
    }
  };

  // Go to previous question
  const handlePrevQuestion = () => {
    const prevQuestion = currentQuestion - 1;
    if (prevQuestion >= 0) {
      setCurrentQuestion(prevQuestion);
    }
  };

  // Go to a specific question
  const goToQuestion = (questionIndex) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestion(questionIndex);
    }
  };

  // ส่วนการแสดงเฉลยคำตอบสำหรับแทรกในหน้าผลลัพธ์
  const renderAnswerExplanations = () => {
    if (isPreLesson || score < 4) {
      return null;
    }
    
    console.log("Rendering explanations for score:", score);
    
    // Try to get quiz state from the stored result
    let finalQuestions = questions;
    let finalSelectedAnswers = selectedAnswers;
    let correctCount = 0;
    let incorrectCount = 0;
    
    // First try to use component state which is most reliable
    if (quizState) {
      console.log("Using quiz state from component state");
      finalQuestions = quizState.questions;
      finalSelectedAnswers = quizState.selectedAnswers;
      correctCount = quizState.correctAnswers.length;
      incorrectCount = finalQuestions.length - correctCount;
    }
    // Then try the window object (backward compatibility)
    else if (window.quizResultState) {
      console.log("Using stored quiz result state from window object");
      const storedState = window.quizResultState;
      finalQuestions = storedState.questions;
      finalSelectedAnswers = storedState.selectedAnswers;
      correctCount = storedState.correctAnswers.length;
      incorrectCount = finalQuestions.length - correctCount;
    } 
    // Finally try localStorage as last resort
    else {
      try {
        const storedStateJson = localStorage.getItem('lastQuizState');
        if (storedStateJson) {
          console.log("Using stored quiz result state from localStorage");
          const storedState = JSON.parse(storedStateJson);
          finalQuestions = storedState.questions;
          finalSelectedAnswers = storedState.selectedAnswers;
          correctCount = storedState.correctAnswers.length;
          incorrectCount = finalQuestions.length - correctCount;
        } else {
          // If all else fails, calculate from current state
          console.log("No stored quiz state found, calculating from current state");
          
          console.log("Current questions:", questions);
          console.log("Current selected answers:", selectedAnswers);
          
          // Calculate correct and incorrect counts manually
          for (let i = 0; i < questions.length; i++) {
            if (!questions[i] || !questions[i].answerOptions) continue;
            
            const answer = selectedAnswers[i];
            if (answer === null || answer === undefined) continue;
            
            const answerOption = questions[i].answerOptions[answer];
            if (!answerOption) continue;
            
            if (answerOption.isCorrect) {
              correctCount++;
            } else {
              incorrectCount++;
            }
          }
        }
      } catch (e) {
        console.error("Error getting quiz state from localStorage:", e);
        correctCount = score; // Fallback to the saved score
        incorrectCount = questions.length - correctCount;
      }
    }
    
    console.log("Using questions:", finalQuestions.length);
    console.log("Using selected answers:", finalSelectedAnswers);
    console.log("Calculated correct count:", correctCount);
    console.log("Calculated incorrect count:", incorrectCount);
    
    return (
      <div className="correct-answers-section">
        <h3><i className="fas fa-check-circle"></i> เฉลยคำตอบ</h3>
        
        <div className="score-summary">
          <div className="correct-summary">
            <i className="fas fa-check-circle"></i> ตอบถูก: {correctCount} ข้อ
          </div>
          <div className="incorrect-summary">
            <i className="fas fa-times-circle"></i> ตอบผิด: {incorrectCount} ข้อ
          </div>
        </div>
        
        {finalQuestions.map((question, questionIndex) => {
          if (!question || !question.answerOptions) return null;
          
          const userAnswerIndex = finalSelectedAnswers[questionIndex];
          const isCorrect = userAnswerIndex !== null && 
                           question.answerOptions && 
                           question.answerOptions[userAnswerIndex] && 
                           question.answerOptions[userAnswerIndex].isCorrect;
          
          const correctAnswerIndex = question.answerOptions.findIndex(option => option.isCorrect);
          
          return (
            <div key={questionIndex} className={`question-answer-item ${isCorrect ? 'correct-item' : 'incorrect-item'}`}>
              <div className="quiz-question">
                <div className={`question-number-badge ${isCorrect ? 'correct-badge' : 'incorrect-badge'}`}>
                  {questionIndex + 1}
                </div>
                <div className="question-text">{question.questionText}</div>
                <div className={`user-result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                  {isCorrect ? 'ตอบถูก' : 'ตอบผิด'}
                </div>
              </div>
              
              <div className="answers-container">
                {question.answerOptions.map((answer, answerIndex) => {
                  const isUserSelected = userAnswerIndex === answerIndex;
                  const isCorrectAnswer = answer.isCorrect;
                  
                  let answerClass = "quiz-answer";
                  if (isUserSelected && isCorrectAnswer) {
                    answerClass += " correct-selected";
                  } else if (isUserSelected && !isCorrectAnswer) {
                    answerClass += " incorrect-selected";
                  } else if (!isUserSelected && isCorrectAnswer) {
                    answerClass += " correct-not-selected";
                  }
                  
                  return (
                    <div 
                      key={answerIndex} 
                      className={answerClass}
                    >
                      <div className={`answer-letter ${isCorrectAnswer ? 'correct-letter' : ''}`}>
                        {String.fromCharCode(65 + answerIndex)}
                      </div>
                      <div className="answer-text">{answer.answerText}</div>
                      
                      {isUserSelected && (
                        <div className={`answer-badge ${isCorrectAnswer ? 'correct' : 'incorrect'}`}>
                          <i className={`fas ${isCorrectAnswer ? 'fa-check' : 'fa-times'}`}></i>
                          {isCorrectAnswer ? 'คำตอบที่คุณเลือก (ถูกต้อง)' : 'คำตอบที่คุณเลือก (ไม่ถูกต้อง)'}
                        </div>
                      )}
                      
                      {!isUserSelected && isCorrectAnswer && (
                        <div className="answer-badge correct">
                          <i className="fas fa-check"></i> คำตอบที่ถูกต้อง
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {!isCorrect && correctAnswerIndex >= 0 && question.answerOptions[correctAnswerIndex] && (
                <div className="correction-message">
                  <i className="fas fa-info-circle"></i> คำตอบที่ถูกต้องคือ: {question.answerOptions[correctAnswerIndex].answerText}
                </div>
              )}
              
              {question.explanation && (
                <div className="answer-explanation">
                  <div className="explanation-header">
                    <i className="fas fa-lightbulb"></i> คำอธิบาย
                  </div>
                  <div>{question.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ไปยังบทเรียนถัดไป
  const goToNextLesson = () => {
    if (nextLessonInfo) {
      if (onClose) {
        onClose();
      }
      
      try {
        navigate(`/student/pretest/${nextLessonInfo.id}`, { 
          replace: true,
          state: { 
            fromLesson: lessonTitle, 
            nextLessonTitle: nextLessonInfo.title,
            nextLessonId: nextLessonInfo.id,
            showPreTest: true
          }
        });
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการนำทาง:", error);
        navigate('/student/ARLearningPlatform', { replace: true });
        showNotification('error', 'เกิดข้อผิดพลาดในการนำทางไปยังบทเรียนถัดไป กรุณาลองอีกครั้ง', 5000);
      }
    } else {
      if (onClose) {
        onClose();
      } else {
        navigate('/student/ARLearningPlatform', { replace: true });
      }
    }
  };

  // Continue to next step in learning flow
  const handleContinue = () => {
    if (isPreLesson) {
      if (onClose) {
        onClose();
      } else {
        navigate('/student/ARLearningPlatform', { replace: true });
      }
      return;
    }

    if (isSubmitted && calculateScore() < 4) {
      showNotification('warning', `คุณได้ ${calculateScore()} คะแนน ซึ่งยังไม่ถึงเกณฑ์ที่กำหนด (4 คะแนน)\nคุณจำเป็นต้องผ่านแบบทดสอบนี้ก่อนจึงจะสามารถเรียนบทต่อไปได้`, 5000);
    }

    if (onClose) {
      onClose();
    } else {
      navigate('/student/ARLearningPlatform', { replace: true });
    }
  };

  // Retry the quiz
  const handleRetry = () => {
    if (originalQuestions && originalQuestions.length > 0) {
      const randomizedData = getRandomizedQuizData({ questions: originalQuestions });
      setQuestions(randomizedData.questions);
      setSelectedAnswers(Array(randomizedData.questions.length).fill(null));
    } else {
      setSelectedAnswers(Array(questions.length).fill(null));
    }
    
    setCurrentQuestion(0);
    setShowScore(false);
    setIsSubmitted(false);
    setShowResults(false);
    setRetryCount(0);
    
    const calculatedTime = Math.max((originalQuestions?.length || questions.length) * 60, 300);
    setTimeLeft(calculatedTime);
    
    setTimeout(fixScrolling, 300);
  };

  useEffect(() => {
    if (showResults) {
      fixScrolling();
      
      const timer1 = setTimeout(fixScrolling, 500);
      const timer2 = setTimeout(fixScrolling, 1500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [showResults, fixScrolling]);

  useEffect(() => {
    // Clean up any global state when component unmounts
    return () => {
      if (window.quizResultState) {
        delete window.quizResultState;
      }
      try {
        localStorage.removeItem('lastQuizState');
      } catch (e) {
        console.warn("Could not remove quiz state from localStorage:", e);
      }
    };
  }, []);

  // Render loading state
  if (loading) {
    return <div className="loading-container">
      <div className="spinner"></div>
      <p>กำลังโหลดแบบทดสอบ...</p>
    </div>;
  }

  // Render empty state
  if (questions.length === 0) {
    return (
      <div className="no-questions-message">
        <h2>ไม่พบข้อมูลแบบทดสอบ</h2>
        <p>ไม่มีคำถามสำหรับบทเรียนนี้</p>
        <button onClick={handleContinue}>
          กลับไปยังบทเรียน
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>กำลังโหลดแบบทดสอบ...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">ลองใหม่อีกครั้ง</button>
        </div>
      ) : showResults ? (
        <div className="result-container">
          <div className="result-header">
            <h2>{isPreLesson ? 'ผลการทำแบบทดสอบก่อนเรียน' : 'ผลการทำแบบทดสอบหลังเรียน'}</h2>
          </div>
          <div className="result-content">
            <div className="score-circle">
              <div className="score-value">{score}</div>
              <div className="score-label">คะแนน</div>
            </div>
            <p className="result-message">
              {isPreLesson
                ? 'ขอบคุณที่ทำแบบทดสอบก่อนเรียน'
                : score >= 4 
                  ? 'ยินดีด้วย! คุณผ่านเกณฑ์'
                  : 'คุณยังไม่ผ่านเกณฑ์ กรุณาลองอีกครั้ง'
              }
            </p>
            <div className="result-detail">
              คุณได้คะแนน {score} จากทั้งหมด {questions.length} ข้อ
              {!isPreLesson && (
                <p>
                  {score >= 4 
                    ? 'คุณผ่านเกณฑ์การประเมิน และสามารถเรียนบทต่อไปได้'
                    : 'คุณต้องได้อย่างน้อย 4 คะแนนเพื่อผ่านบทเรียนนี้'
                  }
                </p>
              )}
            </div>
            <div className="result-actions">
              {isPreLesson ? (
                <button 
                  onClick={handleContinue} 
                  className="result-button continue-button"
                >
                  ไปที่เนื้อหาบทเรียน
                </button>
              ) : (
                <>
                  {score >= 4 && (
                    <button 
                      onClick={goToNextLesson} 
                      className="result-button continue-button"
                    >
                      ไปบทเรียนถัดไป
                    </button>
                  )}
                  <button 
                    onClick={handleRetry} 
                    className="result-button retry-button"
                  >
                    ทำแบบทดสอบอีกครั้ง
                  </button>
                  <button 
                    onClick={handleContinue} 
                    className="result-button continue-button"
                  >
                    กลับไปที่บทเรียน
                  </button>
                </>
              )}
            </div>
          </div>
          
          {!isPreLesson && score >= 4 && renderAnswerExplanations()}
          
          {/* Add a debugging section that is only visible when the results are incorrect */}
          {!isPreLesson && score >= 4 && (!quizState || quizState.correctAnswers.length !== score) && (
            <div className="debug-info" style={{
              margin: '20px 0',
              padding: '15px',
              border: '2px solid #ff5722',
              borderRadius: '8px',
              backgroundColor: '#fff3e0'
            }}>
              <h3 style={{color: '#d84315'}}>พบปัญหาในการแสดงผลคำตอบที่ถูกต้อง</h3>
              <p>คะแนนของคุณคือ {score} แต่การแสดงผลอาจไม่ถูกต้อง กรุณากดปุ่มด้านล่างเพื่อแก้ไข</p>
              <button
                onClick={() => {
                  // Recreate the quiz result state
                  const currentQuestions = questions;
                  const currentAnswers = selectedAnswers;
                  const correctAnswers = [];
                  
                  for (let i = 0; i < currentQuestions.length; i++) {
                    const selectedIndex = currentAnswers[i];
                    if (selectedIndex !== null && selectedIndex !== undefined &&
                        currentQuestions[i] && currentQuestions[i].answerOptions && 
                        currentQuestions[i].answerOptions[selectedIndex] && 
                        currentQuestions[i].answerOptions[selectedIndex].isCorrect) {
                      correctAnswers.push(i);
                    }
                  }
                  
                  // Force score to match actual correct answers to ensure consistency
                  const correctCount = correctAnswers.length;
                  if (correctCount !== score) {
                    console.warn(`Score mismatch: display shows ${score} but actual correct answers is ${correctCount}, fixing...`);
                    setScore(correctCount);
                  }
                  
                  // Create new quiz state
                  const newQuizState = {
                    questions: currentQuestions,
                    selectedAnswers: currentAnswers,
                    score: correctCount,
                    correctAnswers: correctAnswers
                  };
                  
                  // Update all state locations
                  setQuizState(newQuizState);
                  window.quizResultState = newQuizState;
                  
                  try {
                    localStorage.setItem('lastQuizState', JSON.stringify(newQuizState));
                  } catch (e) {
                    console.warn("Could not save quiz state to localStorage:", e);
                  }
                  
                  // Force re-render
                  forceUpdate();
                }}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#ff5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                แก้ไขการแสดงผล
              </button>
            </div>
          )}
          
          {/* Add a message to help users */}
          {!isPreLesson && score >= 4 && (
            <div className="score-note" style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '8px',
              borderLeft: '4px solid #2e7d32'
            }}>
              <p style={{ margin: 0, color: '#2e7d32' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                หากการแสดงผลไม่ถูกต้อง คุณสามารถทำแบบทดสอบอีกครั้งเพื่อแก้ไขปัญหาได้
              </p>
            </div>
          )}
          
          <div className="button-container">
            <button 
              onClick={handleContinue} 
              className="back-button"
              aria-label="กลับไปยังบทเรียน"
            >
              กลับไปยังบทเรียน
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="quiz-header">
            <div className="quiz-title">
              <h2>{quizData && quizData.lessonTitle ? quizData.lessonTitle : lessonTitle}</h2>
              <span className="quiz-type">
                {isPreLesson ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'}
              </span>
            </div>
            <div className="quiz-info">
              <span>ข้อที่ {currentQuestion + 1} จาก {questions.length}</span>
              <span>เวลา: {formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="quiz-content">
            <div className="question-section">
              <div className="question-count">
                คำถามข้อที่ {currentQuestion + 1}
              </div>
              <div className="question-text">
                {questions[currentQuestion].questionText}
              </div>
              <div className="answer-options">
                {questions[currentQuestion].answerOptions.map((answerOption, index) => (
                  <div
                    key={index}
                    className={`answer-option ${selectedAnswers[currentQuestion] === index ? 'selected' : ''}`}
                    onClick={() => handleAnswerOptionClick(index)}
                  >
                    <div className="answer-option-label">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="answer-option-text">
                      {answerOption.answerText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="quiz-navigation">
              <div className="quiz-nav-buttons">
                {currentQuestion > 0 && (
                  <button
                    onClick={handlePrevQuestion}
                    className="quiz-nav-button"
                  >
                    <i className="fas fa-arrow-left"></i> ก่อนหน้า
                  </button>
                )}
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="quiz-nav-button"
                    disabled={selectedAnswers[currentQuestion] === null}
                  >
                    ถัดไป <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="submit-button"
                    disabled={!allQuestionsAnswered}
                  >
                    ส่งคำตอบ
                  </button>
                )}
              </div>
              <div className="question-pagination">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`question-pagination-item 
                      ${currentQuestion === index ? 'active' : ''} 
                      ${selectedAnswers[index] !== null ? 'answered' : ''}`}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="button-container">
            <button 
              onClick={handleContinue} 
              className="back-button"
              aria-label="กลับไปยังบทเรียน"
            >
              กลับไปยังบทเรียน
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LessonQuiz;