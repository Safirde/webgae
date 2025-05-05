import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import "../styles03/PreTestQuiz.css";
import SimpleProfileIcon from '../ProfileAllUser/SimpleProfileIcon'; 
import { useAuth } from '../component01/AuthContext';
import Navbar from '../component04/Navbar';

// กำหนด URL ของ API
const API_BASE_URL = "http://mgt2.pnu.ac.th/safirde";
const PRETEST_SCORE_API_URL = `${API_BASE_URL}/protest_score_db/score_protest_api.php`;
// แก้ไข URL สำหรับตรวจสอบแบบทดสอบก่อนเรียน
const CHECK_PRETEST_URL = `${API_BASE_URL}/protest_score_db/check_pretest_by_lesson.php`;
const CHECK_ALL_PRETESTS_URL = `${API_BASE_URL}/protest_score_db/check_all_pretests.php`;
const LESSONS_API_URL = "http://mgt2.pnu.ac.th/safirde/lessons_db/lessons_api.php";

// ฟังก์ชันแปลงวินาทีเป็นรูปแบบ MM:SS
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// ฟังก์ชันสำหรับสุ่มคำถาม
const shuffleQuestions = (questions) => {
  // สร้างสำเนาของคำถามเพื่อไม่ให้กระทบต่อข้อมูลต้นฉบับ
  const shuffled = [...questions];
  
  // สลับตำแหน่งคำถาม
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// ฟังก์ชันสำหรับสุ่มตัวเลือกคำตอบ
const shuffleAnswerOptions = (question) => {
  // สร้างสำเนาของคำถามและตัวเลือกคำตอบ
  const shuffledQuestion = { ...question };
  
  if (shuffledQuestion.answerOptions && Array.isArray(shuffledQuestion.answerOptions)) {
    // สลับตำแหน่งตัวเลือกคำตอบ
    const shuffledOptions = [...shuffledQuestion.answerOptions];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    shuffledQuestion.answerOptions = shuffledOptions;
  }
  
  return shuffledQuestion;
};

// ฟังก์ชันสำหรับสุ่มคำถามและตัวเลือกคำตอบสำหรับบทเรียน
const getRandomizedLessonData = (lessonData) => {
  if (!lessonData) return null;
  
  // สร้างสำเนาของข้อมูลบทเรียน
  const randomizedData = { ...lessonData };
  
  // สุ่มคำถาม
  randomizedData.questions = shuffleQuestions(lessonData.questions);
  
  // สุ่มตัวเลือกคำตอบของแต่ละคำถาม
  randomizedData.questions = randomizedData.questions.map(question => 
    shuffleAnswerOptions(question)
  );
  
  return randomizedData;
};

const LESSON_DATA = [
  {
    id: 1,
    title: "องค์ประกอบของระบบสุริยะ",
    questions: [
      {
        questionText: 'ศูนย์กลางของระบบสุริยะ คือข้อใด',
        answerOptions: [
          { answerText: 'โลก', isCorrect: false },
          { answerText: 'ดวงจันทร์', isCorrect: false },
          { answerText: 'ดวงอาทิตย์', isCorrect: true },
          { answerText: 'ดาวพฤหัสบดี', isCorrect: false },
        ],
      },
      {
        questionText: 'ข้อใดเป็นดาวฤกษ์',
        answerOptions: [
          { answerText: 'ดาวพุธ', isCorrect: false },
          { answerText: 'ดาวศุกร์', isCorrect: false },
          { answerText: 'ดาวอังคาร', isCorrect: false },
          { answerText: 'ดวงอาทิตย์', isCorrect: true },
        ],
      },
      {
        questionText: 'ระบบสุริยะของเรามีดาวดวงใดเป็นศูนย์กลาง',
        answerOptions: [
          { answerText: 'ดวงจันทร์', isCorrect: false },
          { answerText: 'ดวงอาทิตย์', isCorrect: true },
          { answerText: 'ดาวเคราะห์น้อย', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
        ],
      },
      {
        questionText: 'ข้อใดไม่ใช่ดาวเคราะห์',
        answerOptions: [
          { answerText: 'ดาวพุธ', isCorrect: false },
          { answerText: 'ดาวศุกร์', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
          { answerText: 'ดาวหาง', isCorrect: true },
        ],
      },
      {
        questionText: 'ดาวที่มีแสงสว่างในตัวเอง คือดาวต่อไปนี้ ยกเว้นดาวใด',
        answerOptions: [
          { answerText: 'ดาวเคราะห์', isCorrect: true },
          { answerText: 'ดวงอาทิตย์', isCorrect: false },
          { answerText: 'ดาวฤกษ์', isCorrect: false },
          { answerText: 'ไม่มีข้อถูก', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "ลักษณะของดาวเคราะห์แต่ละดวง",
    questions: [
      {
        questionText: 'ดาวเคราะห์ที่มีขนาดใหญ่ที่สุดในระบบสุริยะ คือข้อใด',
        answerOptions: [
          { answerText: 'ดาวเนปจูน', isCorrect: false },
          { answerText: 'ดาวศุกร์', isCorrect: false },
          { answerText: 'ดาวพฤหัสบดี', isCorrect: true },
          { answerText: 'ดาวเสาร์', isCorrect: false },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ทุกดวงในระบบสุริยะมีลักษณะตามข้อใด',
        answerOptions: [
          { answerText: 'มีสิ่งมีชีวิตอาศัยอยู่', isCorrect: false },
          { answerText: 'มีแสงสว่างในตัวเอง', isCorrect: false },
          { answerText: 'มีวงแหวนล้อมรอบดาว', isCorrect: false },
          { answerText: 'เคลื่อนที่รอบดวงอาทิตย์', isCorrect: true },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ดวงใดหมุนรอบตัวเองแตกต่างไปจากดาวเคราะห์ดวงอื่น',
        answerOptions: [
          { answerText: 'ดาวศุกร์', isCorrect: true },
          { answerText: 'ดาวพุธ', isCorrect: false },
          { answerText: 'ดาวอังคาร', isCorrect: false },
          { answerText: 'ดาวพฤหัส', isCorrect: false },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ดวงใดมีขนาดใหญ่ที่สุด',
        answerOptions: [
          { answerText: 'ดาวเสาร์', isCorrect: false },
          { answerText: 'ดาวพฤหัสบดี', isCorrect: true },
          { answerText: 'ดาวเนปจูน', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ดวงใดได้ชื่อว่า "เตาไฟแช่แข็ง"',
        answerOptions: [
          { answerText: 'ดาวพุธ', isCorrect: true },
          { answerText: 'ดาวศุกร์', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
          { answerText: 'ดาวอังคาร', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "ลำดับของดาวเคราะห์",
    questions: [
      {
        questionText: 'ข้อใดกล่าวไม่ถูกต้องเกี่ยวกับระบบสุริยะ',
        answerOptions: [
          { answerText: 'ดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์มากกว่าโลกคือดาวพุธและดาวศุกร์', isCorrect: false },
          { answerText: 'ดวงอาทิตย์เป็นศูนย์กลางที่ให้พลังงานแก่ดาวเคราะห์ในระบบสุริยะ', isCorrect: false },
          { answerText: 'โลกเป็นดาวฤกษ์ดวงหนึ่งที่อยู่ในระบบสุริยะ', isCorrect: true },
          { answerText: 'ดาวเคราะห์ในระบบสุริยะมีทั้งหมด 8 ดวง', isCorrect: false },
        ],
      },
      {
        questionText: 'ข้อใดเป็นดาวเคราะห์วงนอกทั้งหมดในระบบสุริยะ',
        answerOptions: [
          { answerText: 'ดาวพุธ ดาวศุกร์ โลก', isCorrect: false },
          { answerText: 'ดาวอังคาร ดาวพฤหัส ดาวเสาร์', isCorrect: true },
          { answerText: 'ดาวเนปจูน ดาวยูเรนัส ดาวพลูโต', isCorrect: false },
          { answerText: 'ดาวพฤหัสบดี ดาวศุกร์ ดาวเสาร์', isCorrect: false },
        ],
      },
      {
        questionText: 'การแบ่งกลุ่มดาวเคราะห์ของน้องนิมใช้เกณฑ์ใด ถ้ากลุ่ม 1 มีดาวศุกร์ กลุ่ม 2 มีดาวที่เหลือทั้งหมด',
        answerOptions: [
          { answerText: 'การมีดาวบริวาร', isCorrect: false },
          { answerText: 'ขนาดและอุณหภูมิ', isCorrect: false },
          { answerText: 'ทิศทางการหมุนรอบตัวเอง', isCorrect: true },
          { answerText: 'ระยะห่างระหว่างดวงอาทิตย์', isCorrect: false },
        ],
      },
      {
        questionText: 'การแบ่งกลุ่มดาวเคราะห์ของนิดหน่อยใช้เกณฑ์ใด ถ้าแบ่งเป็นกลุ่ม 1 (ดาวพุธ ดาวศุกร์ โลก ดาวอังคาร) และกลุ่ม 2 (ดาวเสาร์ ดาวพฤหัสบดี ดาวยูเรนัส ดาวเนปจูน)',
        answerOptions: [
          { answerText: 'ขนาด', isCorrect: false },
          { answerText: 'การมีวงแหวน', isCorrect: true },
          { answerText: 'จำนวนดาวบริวาร', isCorrect: false },
          { answerText: 'ทิศทางการหมุนรอบตัวเอง', isCorrect: false },
        ],
      },
      {
        questionText: 'ความสัมพันธ์ในข้อใดไม่ถูกต้อง',
        answerOptions: [
          { answerText: 'ดาวพฤหัสบดี – ราชาแห่งเทพเจ้า', isCorrect: false },
          { answerText: 'ดาวเสาร์ – เทพเจ้าแห่งการเพาะปลูก', isCorrect: false },
          { answerText: 'ดาวยูเรนัส – เทพเจ้าแห่งท้องฟ้า', isCorrect: false },
          { answerText: 'ดาวเนปจูน – เทพเจ้าแห่งนรก', isCorrect: true },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "การโคจรของดาวเคราะห์",
    questions: [
      {
        questionText: 'ข้อใดกล่าวถูกต้อง',
        answerOptions: [
          { answerText: 'ดาวศุกร์อยู่ใกล้ดวงอาทิตย์มากที่สุด', isCorrect: false },
          { answerText: 'ดาวพุธได้รับฉายาว่า "เตาไฟแช่แข็ง"', isCorrect: true },
          { answerText: 'ดาวยูเรนัสเป็นดาวเคราะห์ที่มีขนาดเล็กที่สุด', isCorrect: false },
          { answerText: 'โลกมีดวงจันทร์เป็นดาวบริวาร 4 ดวง', isCorrect: false },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ดวงใดมีวงโคจรรอบดวงอาทิตย์กว้างที่สุด',
        answerOptions: [
          { answerText: 'ดาวพุธ', isCorrect: false },
          { answerText: 'ดาวพฤหัส', isCorrect: false },
          { answerText: 'ดาวยูเรนัส', isCorrect: false },
          { answerText: 'ดาวเนปจูน', isCorrect: true },
        ],
      },
      {
        questionText: 'ดาวเคราะห์ดวงใดใช้เวลาหมุนรอบตัวเองเร็วที่สุด',
        answerOptions: [
          { answerText: 'ดาวพุธ', isCorrect: false },
          { answerText: 'ดาวศุกร์', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
          { answerText: 'ดาวพฤหัสบดี', isCorrect: true },
        ],
      },
      {
        questionText: 'สิ่งใดไม่ใช่บริวารของดวงอาทิตย์',
        answerOptions: [
          { answerText: 'ดาวพฤหัส', isCorrect: false },
          { answerText: 'ดาวเคราะห์น้อย', isCorrect: false },
          { answerText: 'โลก', isCorrect: false },
          { answerText: 'กาแล็กซี', isCorrect: true },
        ],
      },
      {
        questionText: 'ปรากฏการณ์ใดเกิดจากการที่โลกหมุนรอบตัวเอง',
        answerOptions: [
          { answerText: 'ฤดูกาล', isCorrect: false },
          { answerText: 'กลางวันกลางคืน', isCorrect: true },
          { answerText: 'ข้างขึ้นข้างแรม', isCorrect: false },
          { answerText: 'สุริยุปราคา', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "ปรากฏการณ์เกี่ยวกับดวงจันทร์",
    questions: [
      {
        questionText: 'ข้อใดกล่าวถูกต้องเกี่ยวกับดวงจันทร์',
        answerOptions: [
          { answerText: 'เรามองเห็นดวงจันทร์ได้ เพราะดวงจันทร์ได้รับแสงสว่างจากดวงอาทิตย์แล้วสะท้อนมาที่โลก', isCorrect: true },
          { answerText: 'เรามองเห็นดวงจันทร์ได้ เพราะดวงจันทร์มีแสงสว่างในตัวเอง', isCorrect: false },
          { answerText: 'เรามองเห็นดวงจันทร์ในเวลากลางคืนเท่านั้น', isCorrect: false },
          { answerText: 'เรามองเห็นดวงจันทร์ในคืนวันเพ็ญเท่านั้น', isCorrect: false },
        ],
      },
      {
        questionText: 'ในคืนวันเพ็ญดวงจันทร์จะมีลักษณะอย่างไร',
        answerOptions: [
          { answerText: 'มีส่วนสว่างเต็มดวง', isCorrect: true },
          { answerText: 'มีส่วนสว่างเป็นรูปเสี้ยว', isCorrect: false },
          { answerText: 'มีส่วนสว่างครึ่งดวง', isCorrect: false },
          { answerText: 'ไม่มีส่วนสว่าง', isCorrect: false },
        ],
      },
      {
        questionText: 'ข้างขึ้นข้างแรมของดวงจันทร์เกิดจากสาเหตุใด',
        answerOptions: [
          { answerText: 'การหมุนรอบตัวเองของดวงจันทร์', isCorrect: false },
          { answerText: 'การที่ดวงจันทร์โคจรไปรอบๆ โลก', isCorrect: true },
          { answerText: 'การที่โลกหมุนรอบตัวเอง', isCorrect: false },
          { answerText: 'เงาของโลกทอดลงบนดวงจันทร์', isCorrect: false },
        ],
      },
      {
        questionText: 'หากดวงจันทร์อยู่ทิศตะวันออก ดวงอาทิตย์จะอยู่ทิศใด',
        answerOptions: [
          { answerText: 'ทิศใต้', isCorrect: false },
          { answerText: 'ทิศเหนือ', isCorrect: false },
          { answerText: 'ทิศตะวันตก', isCorrect: true },
          { answerText: 'ทิศตะวันออก', isCorrect: false },
        ],
      },
      {
        questionText: 'ดวงจันทร์ขึ้นทางทิศใด',
        answerOptions: [
          { answerText: 'ทิศใต้', isCorrect: false },
          { answerText: 'ทิศเหนือ', isCorrect: false },
          { answerText: 'ทิศตะวันตก', isCorrect: false },
          { answerText: 'ทิศตะวันออก', isCorrect: true },
        ],
      },
    ],
  },
];


const PreTestQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lessonId: lessonIdParam } = useParams();
  const [lessonId, setLessonId] = useState(parseInt(lessonIdParam) || 1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showScore, setShowScore] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [hasCompletedPretest, setHasCompletedPretest] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [lessonData, setLessonData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lockedLessons, setLockedLessons] = useState([]);
  
  // เพิ่มฟังก์ชันเพื่อดึงรหัสนักศึกษา
  const getStudentId = useCallback(() => {
    // ลองดึงจาก localStorage
    if (localStorage.getItem('studentId')) {
      return localStorage.getItem('studentId');
    } 
    // ลองดึงจาก AuthContext
    else if (currentUser && currentUser.studentId) {
      return currentUser.studentId;
    }
    
    // ลองดึงจาก URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('studentId')) {
      return params.get('studentId');
    }
    
    // ลองดึงจากโปรไฟล์ในส่วนอื่นๆ
    if (location.state && location.state.studentId) {
      return location.state.studentId;
    }
    
    // ถ้ายังไม่พบ studentId ให้ดึงจากชื่อผู้ใช้หรืออีเมล
    if (currentUser) {
      if (currentUser.email) {
        return currentUser.email.split('@')[0];
      } else if (currentUser.username) {
        return currentUser.username;
      }
    }
    
    // หาก localStorage มี user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && userData.id) {
          return userData.id;
        }
      } catch (e) {
        console.error("ไม่สามารถแปลงข้อมูลจาก localStorage ได้", e);
      }
    }
    
    return null;
  }, [currentUser, location]);

  // ดึงข้อมูลบทเรียนจาก API
  const fetchAvailableLessons = useCallback(async () => {
    setLoadingLessons(true);
    try {
      // แก้ไข URL ในการเรียก API
      const response = await fetch(LESSONS_API_URL);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          // จัดเรียงบทเรียนตาม ID
          const sortedLessons = result.data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          setAvailableLessons(sortedLessons);
          console.log("ดึงข้อมูลบทเรียนจาก API สำเร็จ:", sortedLessons.length, "บทเรียน");
          setLoadingLessons(false);
          return sortedLessons;
        }
      }
      
      // ถ้าไม่สามารถดึงจาก API ได้ ใช้ข้อมูลจาก LESSON_DATA
      console.log("ไม่สามารถดึงข้อมูลจาก API ได้ ใช้ข้อมูลแบบ hard-coded แทน");
      setAvailableLessons(LESSON_DATA);
      return LESSON_DATA;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลบทเรียน:", error);
      // ใช้ข้อมูลจาก LESSON_DATA เป็น fallback
      setAvailableLessons(LESSON_DATA);
      return LESSON_DATA;
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  // ตรวจสอบว่านักเรียนได้ทำแบบทดสอบแล้วหรือไม่
  const checkIfPretestCompleted = useCallback(async (studentId, lessonId) => {
    if (!studentId) return false;
    
    try {
      // ดึงชื่อบทเรียนจาก ID
      const lessonSource = availableLessons.length > 0 ? availableLessons : LESSON_DATA;
      const lesson = lessonSource.find(lesson => parseInt(lesson.id) === parseInt(lessonId));
        
      if (!lesson) {
        console.error(`ไม่พบข้อมูลบทเรียนรหัส ${lessonId}`);
        return false;
      }
      
      const lessonTitle = lesson.title;
      
      // เรียกใช้ API โดยส่ง student_id และ lesson_title
      const response = await fetch(`${CHECK_PRETEST_URL}?student_id=${studentId}&lesson_title=${encodeURIComponent(lessonTitle)}`);
      const data = await response.json();
      
      console.log(`ผลการตรวจสอบ pretest บทที่ ${lessonId}:`, data);
      
      // ถ้า status เป็น 'completed' แสดงว่านักเรียนได้ทำแบบทดสอบแล้ว
      return data.status === 'completed';
    } catch (error) {
      console.error(`เกิดข้อผิดพลาดในการตรวจสอบสถานะ pretest บทที่ ${lessonId}:`, error);
      return false;
    }
  }, [availableLessons]);

  // ตรวจสอบบทเรียนที่ทำไปแล้ว
  const checkCompletedLessons = useCallback(async (studentId) => {
    if (!studentId) return [];
    
    try {
      // เรียกใช้ API ใหม่ที่ตรวจสอบทุกบทเรียน
      const response = await fetch(`${CHECK_ALL_PRETESTS_URL}?student_id=${studentId}`);
      const data = await response.json();
      
      console.log("ผลการตรวจสอบบทเรียนที่ทำแล้ว:", data);
      
      if (data.status === 'success') {
        // ดึงรายการบทเรียนที่ทำแล้วจาก API
        const completedLessonIds = data.completed_lessons.map(lesson => parseInt(lesson.lesson_id));
        return completedLessonIds;
      }
      
      return [];
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตรวจสอบบทเรียนที่ทำแล้ว:", error);
      return [];
    }
  }, []);

  // ตรวจสอบบทเรียนที่ควรถูกล็อค
  const checkLockedLessons = useCallback(async (studentId) => {
    try {
      // ตรวจสอบว่าบทเรียนไหนทำแล้วหรือยัง
      const completed = await checkCompletedLessons(studentId);
      setCompletedLessons(completed);
      
      // กำหนดลำดับการปลดล็อคบทเรียน (บทแรกไม่ล็อค)
      const locked = [];
      let previousLessonId = 0;
      
      // ตรวจสอบบทเรียนที่มีทั้งหมด
      const allLessons = availableLessons.length > 0 ? availableLessons : LESSON_DATA;
      
      for (const lesson of allLessons) {
        const lessonId = parseInt(lesson.id);
        
        // บทแรกไม่ล็อค
        if (lessonId === 1) {
          previousLessonId = 1;
          continue;
        }
        
        // ตรวจสอบว่าบทก่อนหน้าได้ทำไปแล้วหรือไม่
        const isPreviousCompleted = completed.includes(previousLessonId);
        
        // ถ้าบทก่อนหน้ายังไม่ได้ทำ ให้ล็อคบทนี้
        if (!isPreviousCompleted) {
          locked.push(lessonId);
        }
        
        previousLessonId = lessonId;
      }
      
      setLockedLessons(locked);
      return locked;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตรวจสอบบทเรียนที่ล็อค:", error);
      return [];
    }
  }, [checkCompletedLessons, availableLessons]);

  // แก้ไข useEffect หลักของคอมโพเนนต์
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setLoading(true);
        
        // 1. โหลดบทเรียนก่อน
        const lessons = await fetchAvailableLessons();
        
        // 2. ดึงรหัสนักศึกษา
        const id = getStudentId();
        setStudentId(id);
        
        // 3. ตรวจสอบค่า lessonId ให้ถูกต้อง
        const lessonIdNumber = parseInt(lessonIdParam) || 1;
        setLessonId(lessonIdNumber);
        
        if (id) {
          // 4. ตรวจสอบบทเรียนที่ทำแล้ว
          const completed = await checkCompletedLessons(id);
          setCompletedLessons(completed);
          
          // 5. ตรวจสอบว่าบทเรียนใดควรถูกล็อค
          const locked = await checkLockedLessons(id);
          
          // 6. ตรวจสอบว่าทำแบบทดสอบนี้แล้วหรือยัง
          const lessonCompleted = await checkIfPretestCompleted(id, lessonIdNumber);
          setHasCompletedPretest(lessonCompleted);
    
          // 8. ถ้าบทนี้ถูกล็อค ให้ไปบทที่ไม่ล็อคและยังไม่ได้ทำ
          if (locked.includes(lessonIdNumber)) {
            for (let i = 1; i <= totalLessons; i++) {
              if (!locked.includes(i) && !completed.includes(i)) {
                setLessonId(i);
                break;
              }
            }
          }
        }
        
        // 9. โหลดข้อมูลบทเรียน (ใช้ค่า lessonId ล่าสุด)
        const currentLessonId = lessonIdNumber;
        const lessonSource = lessons; // ใช้ lessons ที่ได้จาก fetchAvailableLessons
        const currentLessonData = lessonSource.find(lesson => 
          parseInt(lesson.id) === currentLessonId
        );
        
        if (currentLessonData) {
          console.log("พบข้อมูลบทเรียน:", currentLessonData.title);
          const randomizedLesson = getRandomizedLessonData(currentLessonData);
          setLessonData(randomizedLesson);
          setSelectedAnswers(Array(randomizedLesson.questions.length).fill(null));
          
          // 10. ตั้งค่าเวลาในการทำข้อสอบ
          const calculatedTime = Math.max(randomizedLesson.questions.length * 60, 300);
          setTimeLeft(calculatedTime);
        } else {
          console.warn("ไม่พบข้อมูลบทเรียน ID:", currentLessonId);
          
          // ใช้บทเรียนแรกถ้าไม่พบบทเรียนที่ระบุ
          const firstLesson = lessonSource[0];
          if (firstLesson) {
            const randomizedFirstLesson = getRandomizedLessonData(firstLesson);
            setLessonData(randomizedFirstLesson);
            setSelectedAnswers(Array(randomizedFirstLesson.questions.length).fill(null));
            
            // ตั้งค่าเวลาในการทำข้อสอบ
            const calculatedTime = Math.max(randomizedFirstLesson.questions.length * 60, 300);
            setTimeLeft(calculatedTime);
          } else {
            console.error("ไม่พบข้อมูลบทเรียนใดๆ");
          }
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเริ่มต้นคอมโพเนนต์:", error);
      } finally {
        setLoading(false);
      }
    };

    // เรียกใช้ฟังก์ชันเริ่มต้น
    initializeComponent();
  }, [fetchAvailableLessons, getStudentId, checkCompletedLessons, checkLockedLessons, checkIfPretestCompleted, lessonIdParam, navigate]);

  // แก้ไขฟังก์ชัน changeLesson
  const changeLesson = (id) => {
    // ตรวจสอบว่า id ที่ส่งมายังเป็น id เดิมหรือไม่
    if (id === lessonId) {
      console.log("ไม่มีการเปลี่ยนบทเรียนเนื่องจากเป็นบทเรียนปัจจุบัน");
      return;
    }
    
    // ตรวจสอบว่าบทเรียนที่ต้องการเปลี่ยนถูกล็อคหรือไม่
    if (lockedLessons.includes(id)) {
      alert(`บทเรียนนี้ยังไม่ปลดล็อค คุณต้องทำแบบทดสอบก่อนเรียนของบทก่อนหน้าให้เสร็จก่อน`);
      return;
    }
    
    // ตรวจสอบว่าบทเรียนที่ต้องการเปลี่ยนได้ทำไปแล้วหรือไม่
    if (completedLessons.includes(id)) {
      // ถ้าทำไปแล้ว ให้หาบทเรียนที่ยังไม่ได้ทำบทแรก
      const lessonSource = availableLessons.length > 0 ? availableLessons : LESSON_DATA;
      const nextLessonId = lessonSource
        .find(lesson => !completedLessons.includes(parseInt(lesson.id)))?.id;
      
      if (nextLessonId) {
        // เปลี่ยนไปยังบทเรียนที่ยังไม่ได้ทำ
        const originalLesson = lessonSource
          .find(lesson => parseInt(lesson.id) === parseInt(nextLessonId));
          
        if (originalLesson) {
          // ใช้การสุ่มคำถามและตัวเลือกสำหรับบทเรียนใหม่
          const randomizedLesson = getRandomizedLessonData(originalLesson);
          
          setLessonId(parseInt(nextLessonId));
          setLessonData(randomizedLesson);
          setSelectedAnswers(Array(randomizedLesson.questions.length).fill(null));
          setCurrentQuestion(0);
          setShowScore(false);
          setIsSubmitted(false);
          setHasCompletedPretest(false);
          
          // รีเซ็ตเวลา
          const calculatedTime = Math.max(randomizedLesson.questions.length * 60, 300);
          setTimeLeft(calculatedTime);
        }
        return;
      } else {
        // ถ้าทำครบทุกบทแล้ว ให้นำทางไปยังหน้า AR Learning
        navigate('/student/ARLearningPlatform', { replace: true });
      }
    }
    
    // กรณีที่บทเรียนยังไม่ได้ทำ
    const lessonSource = availableLessons.length > 0 ? availableLessons : LESSON_DATA;
    const originalLesson = lessonSource
      .find(lesson => parseInt(lesson.id) === parseInt(id));
      
    if (originalLesson) {
      // ใช้การสุ่มคำถามและตัวเลือกสำหรับบทเรียนใหม่
      const randomizedLesson = getRandomizedLessonData(originalLesson);
      
      setLessonId(parseInt(id));
      setLessonData(randomizedLesson);
      setSelectedAnswers(Array(randomizedLesson.questions.length).fill(null));
      setCurrentQuestion(0);
      setShowScore(false);
      setIsSubmitted(false);
      setHasCompletedPretest(false);
      
      // รีเซ็ตเวลา
      const calculatedTime = Math.max(randomizedLesson.questions.length * 60, 300);
      setTimeLeft(calculatedTime);
    }
  };

  // นับเวลาถอยหลัง
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

  // ตรวจสอบว่าตอบครบทุกข้อหรือไม่
  useEffect(() => {
    const checkAllAnswered = () => {
      const answered = selectedAnswers.every(answer => answer !== null);
      setAllQuestionsAnswered(answered);
    };
    
    checkAllAnswered();
  }, [selectedAnswers]);

// ตรวจสอบว่าทำแบบทดสอบครบทุกหน่วยหรือไม่
const areAllLessonsCompleted = useCallback(() => {
  const totalLessons = availableLessons.length > 0 ? availableLessons.length : LESSON_DATA.length;
  return completedLessons.length === totalLessons;
}, [completedLessons, availableLessons]);

// ตรวจสอบว่าตอบทุกข้อหรือยัง
const areAllQuestionsAnswered = () => {
  return selectedAnswers.every(answer => answer !== null);
};

const getUnansweredQuestions = () => {
  const unanswered = [];
  selectedAnswers.forEach((answer, index) => {
    if (answer === null) {
      unanswered.push(index + 1);
    }
  });
  return unanswered;
};

const calculateScore = () => {
  if (!lessonData || !lessonData.questions) return 0;
  
  let score = 0;
  for (let i = 0; i < lessonData.questions.length; i++) {
    if (selectedAnswers[i] !== null && lessonData.questions[i].answerOptions[selectedAnswers[i]].isCorrect) {
      score++;
    }
  }
  return score;
};

// เลือกคำตอบ
const handleAnswerOptionClick = (answerIndex) => {
  const newAnswers = [...selectedAnswers];
  newAnswers[currentQuestion] = answerIndex;
  setSelectedAnswers(newAnswers);
};

const handleNextQuestion = () => {
  if (!lessonData || !lessonData.questions) return;
  
  const nextQuestion = currentQuestion + 1;
  if (nextQuestion < lessonData.questions.length) {
    setCurrentQuestion(nextQuestion);
  } else {
    handleSubmit(); // ส่งคำตอบทันทีเมื่อไปถึงข้อสุดท้าย
  }
};

// ไปข้อก่อนหน้า
const handlePrevQuestion = () => {
  const prevQuestion = currentQuestion - 1;
  if (prevQuestion >= 0) {
    setCurrentQuestion(prevQuestion);
  }
};

// ไปที่ข้อใดข้อหนึ่ง
const goToQuestion = (questionIndex) => {
  if (!lessonData || !lessonData.questions) return;
  
  if (questionIndex >= 0 && questionIndex < lessonData.questions.length) {
    setCurrentQuestion(questionIndex);
  }
};

// ส่งคะแนนไปยังเซิร์ฟเวอร์
const sendScoreToBackend = useCallback(async (score) => {
  if (!lessonData) return false;
  
  // ใช้ studentId ที่ได้จาก state
  let currentStudentId = studentId;
  
  // ถ้ายังไม่มี studentId ให้ขอจากผู้ใช้
  if (!currentStudentId) {
    const inputId = prompt("กรุณาระบุรหัสนักศึกษาของคุณเพื่อบันทึกคะแนน:", "");
    if (inputId && inputId.trim() !== "") {
      currentStudentId = inputId.trim();
      // บันทึกไว้สำหรับใช้ในอนาคต
      localStorage.setItem('studentId', currentStudentId);
      setStudentId(currentStudentId);
    } else {
      // ถ้าผู้ใช้ไม่ระบุรหัส ให้ใช้ค่าสุ่ม
      currentStudentId = "guest_" + Math.floor(Math.random() * 100000);
    }
  }
  
  // ดึงชื่อ-นามสกุล (ถ้ามี)
  let fullName = "";
  if (currentUser && currentUser.displayName) {
    fullName = currentUser.displayName;
  } else if (currentUser && (currentUser.firstName || currentUser.lastName)) {
    fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  }
  
  // หาก localStorage มี studentName
  if (!fullName) {
    const studentName = localStorage.getItem('studentName');
    if (studentName) {
      fullName = studentName;
    }
  }
  
  // ตรวจสอบอีกครั้งว่ามี studentId หรือไม่
  if (!currentStudentId) {
    console.error("ไม่สามารถระบุรหัสนักศึกษาได้ ไม่สามารถส่งคะแนนได้");
    return false;
  }
  
  try {
    // เพิ่มการตรวจสอบว่าเคยทำแบบทดสอบแล้วหรือไม่ก่อนส่งคะแนน
    const hasCompleted = await checkIfPretestCompleted(currentStudentId, lessonId);
    if (hasCompleted) {
      // หาบทเรียนที่ยังไม่ได้ทำบทแรก
      const nextLessonId = (availableLessons.length > 0 ? availableLessons : LESSON_DATA)
        .find(lesson => !completedLessons.includes(parseInt(lesson.id)))?.id;
      
      if (nextLessonId) {
        // เปลี่ยนไปยังบทเรียนที่ยังไม่ได้ทำ
        changeLesson(nextLessonId);
      } else {
        // ถ้าทำครบทุกบทแล้ว ให้นำทางไปยังหน้า AR Learning
        navigate('/student/ARLearningPlatform', { replace: true });
      }
      return false;
    }
    
    // ส่งคะแนนไปยังฐานข้อมูลโดยใช้ API ใหม่
    const response = await fetch(PRETEST_SCORE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: currentStudentId,
        name: fullName || currentStudentId,
        lesson_id: lessonId,
        lesson_title: lessonData.title,
        pre_test_score: score,
        post_test_score: null,
        created_at: new Date().toISOString()
      })
    });
    
    // แปลงข้อมูลเป็น JSON
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("ข้อผิดพลาดในการแปลง response เป็น JSON:", e);
      return false;
    }
    
    if (data.status === 'success') {
      console.log(`บันทึกคะแนนบทที่ ${lessonId} ในฐานข้อมูลสำเร็จ:`, data);
      
      // บันทึกลง localStorage ด้วยเพื่อความปลอดภัย
      localStorage.setItem(`pretest_score_lesson_${lessonId}`, score);
      localStorage.setItem(`pretest_completed_lesson_${lessonId}`, 'true');
      localStorage.setItem(`pretest_timestamp_lesson_${lessonId}`, new Date().toISOString());
      
      // อัปเดตรายการบทเรียนที่ทำแล้ว
      setCompletedLessons(prev => {
        if (!prev.includes(lessonId)) {
          return [...prev, lessonId];
        }
        return prev;
      });
      
      // หลังจากบันทึกคะแนนสำเร็จ ตรวจสอบว่าทำแบบทดสอบครบทุกบทแล้วหรือไม่
      const updatedCompletedLessons = [...completedLessons];
      if (!updatedCompletedLessons.includes(lessonId)) {
        updatedCompletedLessons.push(lessonId);
      }
      
      // ถ้าทำครบทุกบทแล้ว ให้นำทางไปยังหน้า AR Learning โดยอัตโนมัติ
      const totalLessons = availableLessons.length > 0 ? availableLessons.length : LESSON_DATA.length;
      if (updatedCompletedLessons.length === totalLessons) {
        setTimeout(() => {
          navigate('/student/ARLearningPlatform', { replace: true });
        }, 1500); // รอเล็กน้อยเพื่อให้ผู้ใช้เห็นผลคะแนน
      } else {
        // ถ้ายังทำไม่ครบ ให้เปลี่ยนไปยังบทถัดไปโดยอัตโนมัติ
        setTimeout(() => {
          const nextLessonId = (availableLessons.length > 0 ? availableLessons : LESSON_DATA)
            .find(lesson => !updatedCompletedLessons.includes(parseInt(lesson.id)))?.id;
            
          if (nextLessonId) {
            changeLesson(nextLessonId);
          }
        }, 1500);
      }
      
      return true;
    } else {
      console.warn(`มีปัญหาในการบันทึกคะแนนบทที่ ${lessonId} ในฐานข้อมูล:`, data.message);
      return false;
    }
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการส่งคะแนนบทที่ ${lessonId} ไปยังฐานข้อมูล:`, error);
    return false;
  }
}, [studentId, currentUser, checkIfPretestCompleted, lessonId, lessonData, completedLessons, navigate, changeLesson, availableLessons]);

const handleSubmit = () => {
  if (!lessonData || !lessonData.questions) return;
  
  // ตรวจสอบว่ามีคำถามที่ยังไม่ได้ตอบหรือไม่
  const unansweredQuestions = selectedAnswers.filter(answer => answer === null).length;
  
  if (unansweredQuestions > 0) {
    // ถามยืนยันก่อนส่งหากยังมีคำถามที่ยังไม่ได้ตอบ
    const confirm = window.confirm(`ยังมีคำถามที่ยังไม่ได้ตอบ ${unansweredQuestions} ข้อ ต้องการส่งคำตอบหรือไม่?`);
    if (!confirm) return;
  }
  
  const preTestScore = calculateScore();
  setIsSubmitted(true);
  setShowScore(true);

  console.log(`คะแนนที่ได้ (บทที่ ${lessonId}):`, preTestScore, "จาก", lessonData.questions.length);

  sendScoreToBackend(preTestScore)
    .then(success => {
      if (success) {
        console.log(`บันทึกคะแนนบทที่ ${lessonId} สำเร็จ`);
        setHasCompletedPretest(true);
        
        // ตรวจสอบว่าทำแบบทดสอบครบทุกบทแล้วหรือไม่
        const updatedCompletedLessons = [...completedLessons];
        if (!updatedCompletedLessons.includes(lessonId)) {
          updatedCompletedLessons.push(lessonId);
        }
        
        // เพิ่มแสดงผลคะแนนแบบป๊อปอัพเพื่อให้ผู้ใช้รู้ว่าได้คะแนนเท่าไร
        alert(`คุณได้ ${preTestScore} คะแนน จากทั้งหมด ${lessonData.questions.length} ข้อ`);
        
        // ถ้าทำครบทุกบทแล้ว ให้นำทางไปยังหน้า AR Learning โดยอัตโนมัติ
        const totalLessons = availableLessons.length > 0 ? availableLessons.length : LESSON_DATA.length;
        if (updatedCompletedLessons.length === totalLessons) {
          navigate('/student/ARLearningPlatform', { replace: true });
        } else {
          // ถ้ายังทำไม่ครบ ให้เปลี่ยนไปยังบทถัดไปโดยอัตโนมัติ
          const nextLessonId = (availableLessons.length > 0 ? availableLessons : LESSON_DATA)
            .find(lesson => !updatedCompletedLessons.includes(parseInt(lesson.id)))?.id;
            
          if (nextLessonId) {
            changeLesson(nextLessonId);
          }
        }
      } else {
        console.warn(`มีปัญหาในการบันทึกคะแนนบทที่ ${lessonId} แต่สามารถดำเนินการต่อได้`);
      }
    })
    .catch(error => {
      console.error(`เกิดข้อผิดพลาดในการส่งคะแนนบทที่ ${lessonId}:`, error);
    });
};

// ออกจากระบบ
const handleLogout = () => {
  if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
    localStorage.clear();
    navigate("/student/StudentSignIn", { replace: true });
  }
};

// ฟังก์ชันสำหรับสร้างปุ่มตัวเลขที่จะแสดง
const renderPaginationNumbers = () => {
  // สร้างตัวแสดงข้อที่ตอบแล้ว/ยังไม่ตอบ
  return (
    <div className="progress-tracker">
      {selectedAnswers.map((answer, index) => (
        <div 
          key={index} 
          className={`progress-dot ${answer !== null ? 'answered' : ''} ${currentQuestion === index ? 'current' : ''}`}
          onClick={() => setCurrentQuestion(index)}
          style={{
            display: 'inline-block',
            width: '30px',
            height: '30px',
            margin: '5px',
            borderRadius: '50%',
            textAlign: 'center',
            lineHeight: '30px',
            background: answer !== null ? '#4CAF50' : '#f0f0f0',
            color: answer !== null ? 'white' : 'black',
            cursor: 'pointer',
            border: currentQuestion === index ? '2px solid #007bff' : '1px solid #ccc'
          }}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
};

// ฟังก์ชันสำหรับแสดงรายการบทเรียน
const renderLessonList = () => {
  // ใช้ข้อมูลบทเรียนที่เหมาะสม
  const lessonsToRender = availableLessons.length > 0 ? availableLessons : LESSON_DATA;
  
  return (
    <div className="lesson-list">
      <h3>แบบทดสอบก่อนเรียน</h3>
      <div className="lesson-buttons">
        {lessonsToRender.map((lesson) => {
          const lessonIdNumber = parseInt(lesson.id);
          const isCompleted = completedLessons.includes(lessonIdNumber);
          const isActive = lessonId === lessonIdNumber;
          const isLocked = lockedLessons.includes(lessonIdNumber);
          
          return (
            <button
              key={lessonIdNumber}
              className={`lesson-button ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => changeLesson(lessonIdNumber)}
              disabled={isCompleted || isLocked}
            >
              {lesson.title}
              {isCompleted && <span className="success-icon">✓</span>}
              {isLocked && <span className="lock-icon">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// แสดงเนื้อหาแบบทดสอบ
const renderContent = () => {
  if (!lessonData || !lessonData.questions || lessonData.questions.length === 0) {
    return (
      <div className="no-questions">
        <h2>ไม่พบคำถามสำหรับบทเรียนนี้</h2>
        <p>กรุณาเลือกบทเรียนอื่น หรือติดต่อผู้ดูแลระบบ</p>
      </div>
    );
  }
  
  if (showScore) {
    return (
      <div className="score-section">
        <h2>ผลการทดสอบก่อนเรียน: {lessonData.title}</h2>
        <div className="score-display">
          <p>คะแนนของคุณ</p>
          <h3>{calculateScore()} / {lessonData.questions.length}</h3>
          <p>({((calculateScore() / lessonData.questions.length) * 100).toFixed(2)}%)</p>
        </div>
        <p>คะแนนนี้เป็นการวัดความรู้เบื้องต้นก่อนเรียน คุณสามารถเข้าเรียนเนื้อหาบทเรียนได้ทันที</p>
        <button 
          className="continue-button"
          onClick={() => navigate('/student/ARLearningPlatform')}
        >
          ไปยังบทเรียน
        </button>
      </div>
    );
  }
  
  return (
    <>
      <div className="progress-container">
        <div className="quiz-header">
          <h2>แบบทดสอบก่อนเรียน: {lessonData.title}</h2>
        </div>
        <div className="progress-info">
          <span className="progress-text">ข้อ {currentQuestion + 1} จาก {lessonData.questions.length}</span>
          <span className="progress-text text-success">{((currentQuestion + 1) / lessonData.questions.length * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(currentQuestion + 1) / lessonData.questions.length * 100}%` }}
          ></div>
        </div>
        
        {timeLeft !== null && (
          <div className="timer">
            <span>เวลา: {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
      
      {renderPaginationNumbers()}

      <div className="question-container">
        <h2 className="question-text">
          {currentQuestion + 1}. {lessonData.questions[currentQuestion].questionText}
        </h2>
        <div className="answer-options">
          {lessonData.questions[currentQuestion].answerOptions.map((answerOption, index) => (
            <div 
              key={index}
              className={`answer-option ${selectedAnswers[currentQuestion] === index ? 'selected' : ''}`}
              onClick={() => handleAnswerOptionClick(index)}
            >
              <span className="answer-option-letter">{['ก', 'ข', 'ค', 'ง'][index]}.</span> {answerOption.answerText}
            </div>
          ))}
        </div>
      </div>
      
      <div className="navigation-buttons">
        <button
          className="prev-button"
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
        >
          ข้อก่อนหน้า
        </button>
        
        {currentQuestion < lessonData.questions.length - 1 ? (
          <button
            className="next-button"
            onClick={handleNextQuestion}
          >
            ข้อถัดไป
          </button>
        ) : (
          <button
            className="submit-button"
            onClick={handleSubmit}
          >
            ส่งคำตอบ
          </button>
        )}
      </div>
    </>
  );
};

// เมื่อโหลดข้อมูล แสดงข้อความโหลด
if (loading || loadingLessons) {
  return (
    <div>
      <Navbar activePage="pretest" onLogout={handleLogout} />
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">กำลังโหลดแบบทดสอบ...</p>
        </div>
      </div>
    </div>
  );
}

// แสดงหน้าเว็บหลัก
return (
  <div>
    {/* Navbar Component */}
    <Navbar activePage="pretest" onLogout={handleLogout} />

    {/* Main Content */}
    <div className="main-content">
      <div className="pretest-container">
        {/* รายการบทเรียน */}
        {renderLessonList()}
        
        {/* แสดงข้อความเกี่ยวกับการเรียน */}
        <div className="learning-flow-info">
          <h3>ขั้นตอนการเรียนรู้</h3>
          <ol>
            <li>ทำแบบทดสอบก่อนเรียนให้ครบทุกบท</li>
            <li>เข้าศึกษาเนื้อหาบทเรียน</li>
            <li>ทำแบบทดสอบหลังเรียน (ต้องได้อย่างน้อย 4 คะแนนจึงจะผ่าน)</li>
            <li>เมื่อทำแบบทดสอบหลังเรียนผ่านแล้วจึงจะสามารถเรียนบทต่อไปได้</li>
          </ol>
        </div>

        {/* เนื้อหาหลัก */}
        <div className="pretest-card">
          {hasCompletedPretest ? (
            // แสดงข้อความเมื่อทำแบบทดสอบไปแล้ว
            <div className="completed-pretest-message">
              <h2>
                <span style={{ color: "#3a86ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" 
                      stroke="#3a86ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                      style={{ marginRight: "10px" }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  คุณได้ทำแบบทดสอบก่อนเรียนนี้แล้ว
                </span>
              </h2>
              <p>กำลังนำท่านไปยังบทเรียนถัดไป...</p>
              <div className="button-group">
                <button 
                  className="continue-button"
                  onClick={() => navigate('/student/ARLearningPlatform')}
                >
                  ไปยังหน้าบทเรียน
                </button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default PreTestQuiz;