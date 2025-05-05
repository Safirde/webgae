import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../styles03/ARLearningPlatform.css";
import LessonQuiz from './LessonQuiz';
import SimpleProfileIcon from '../ProfileAllUser/SimpleProfileIcon'; 
import { useAuth } from '../component01/AuthContext';
import Navbar from '../component04/Navbar';

// API URLs
const API_URL = "http://mgt2.pnu.ac.th/safirde/lessons_db/lessons_api.php";
const PRETEST_SCORES_API_URL = "http://mgt2.pnu.ac.th/safirde/protest_score_db/score_protest_api.php";
const PROGRESS_API_URL = "http://mgt2.pnu.ac.th/safirde/progress_db/progress_api.php";
const BACKUP_PRETEST_API_URL = "http://mgt2.pnu.ac.th/safirde/protest_score_db/score_api.php";
const BACKUP_SCORES_API_URL = "http://mgt2.pnu.ac.th/safirde/scores_db/score_api.php";

// คอนสแตนท์สำหรับบทเรียนที่ไม่ต้องล็อค
const UNLOCKED_LESSON_TITLES = ["องค์ประกอบของระบบสุริยะ"];

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อกับ API
const checkApiConnection = async (apiUrl) => {
  try {
    const timeoutId = setTimeout(() => {
      throw new Error('Connection timeout');
    }, 5000);
    
    const response = await fetch(apiUrl);
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    console.warn(`API connection check failed: ${error.message}`);
    return false;
  }
};

// ฟังก์ชันสำหรับการส่งข้อมูลไปยัง API โดยลองหลายวิธี
const sendDataToApi = async (primaryApiUrl, backupApiUrl, data) => {
  // ลองส่งข้อมูลแบบ JSON ไปยัง API หลัก
  try {
    const response = await fetch(primaryApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
  } catch (error) {
    console.warn(`JSON request to primary API failed: ${error.message}`);
  }
  
  // ลองส่งข้อมูลแบบ Form data ไปยัง API หลัก
  try {
    const formData = new URLSearchParams();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    
    const response = await fetch(primaryApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
  } catch (error) {
    console.warn(`Form data request to primary API failed: ${error.message}`);
  }
  
  // ลองส่งข้อมูลแบบ JSON ไปยัง API สำรอง
  if (backupApiUrl) {
    try {
      const response = await fetch(backupApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return { success: true, data: await response.json() };
      }
    } catch (error) {
      console.warn(`JSON request to backup API failed: ${error.message}`);
    }
  }
  
  return { success: false, error: 'All API attempts failed' };
};

// ฟังก์ชันสำหรับการดึงข้อมูลจาก API โดยลองหลายวิธี
const fetchDataFromApi = async (primaryApiUrl, backupApiUrl, params = {}) => {
  // สร้าง URL พร้อมพารามิเตอร์
  const queryParams = new URLSearchParams();
  for (const key in params) {
    queryParams.append(key, params[key]);
  }
  const primaryUrlWithParams = `${primaryApiUrl}?${queryParams.toString()}`;
  
  // ลองดึงข้อมูลจาก API หลัก
  try {
    const response = await fetch(primaryUrlWithParams);
    
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
  } catch (error) {
    console.warn(`Request to primary API failed: ${error.message}`);
  }
  
  // ลองดึงข้อมูลจาก API สำรอง
  if (backupApiUrl) {
    const backupUrlWithParams = `${backupApiUrl}?${queryParams.toString()}`;
    
    try {
      const response = await fetch(backupUrlWithParams);
      
      if (response.ok) {
        return { success: true, data: await response.json() };
      }
    } catch (error) {
      console.warn(`Request to backup API failed: ${error.message}`);
    }
  }
  
  return { success: false, error: 'All API attempts failed' };
};

const ARLearningPlatform = () => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("lessons");
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPreLesson, setIsPreLesson] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLessons, setNewLessons] = useState([]);
  const [updatedLessons, setUpdatedLessons] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProgress, setUserProgress] = useState({});
  const [contentViewed, setContentViewed] = useState({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { id: lessonIdFromUrl } = useParams(); // Get lesson ID from URL

  // ฟังก์ชันสำหรับแสดงข้อความแจ้งเตือนแบบ Toast
  const showToast = (message, duration = 3000, type = 'info') => {
    setToastMessage(message);
    setToastVisible(true);
    
    // ตั้งเวลาให้ปิดการแจ้งเตือนหลังจากเวลาที่กำหนด
    setTimeout(() => {
      setToastVisible(false);
    }, duration);
  };

  // ฟังก์ชันสำหรับโหลดบทเรียน
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/lessons`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // เรียงลำดับบทเรียนตาม ID
        const sortedLessons = result.data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        // เพิ่มคำอธิบายสำหรับคำตอบในแบบทดสอบ
        sortedLessons.forEach(lesson => {
          // เพิ่มคำอธิบายให้แบบทดสอบหลังเรียน
          if (lesson.questions && Array.isArray(lesson.questions)) {
            lesson.questions.forEach(question => {
              // สร้างคำอธิบายอัตโนมัติหากยังไม่มี
              if (!question.explanation) {
                // หาตัวเลือกที่ถูกต้อง
                const correctOption = question.answerOptions.find(option => option.isCorrect);
                if (correctOption) {
                  question.explanation = `คำตอบที่ถูกต้องคือ "${correctOption.answerText}" เนื่องจากเป็นข้อความที่ตรงกับเนื้อหาที่เรียน`;
                }
              }
            });
          }
        });
        
        setLessons(sortedLessons);
        console.log("Loaded lessons successfully:", sortedLessons.length, "lessons");
        
        // บันทึกข้อมูลบทเรียนลง cache
        localStorage.setItem('cachedLessons', JSON.stringify(sortedLessons));
        
        checkForNewAndUpdatedLessons(sortedLessons);
        await loadUserProgress(sortedLessons);
        
        // Handle direct navigation to a lesson by ID
        if (lessonIdFromUrl) {
          const lessonToSelect = sortedLessons.find(lesson => lesson.id === lessonIdFromUrl);
          if (lessonToSelect) {
            setSelectedLesson(lessonToSelect);
            
            // ตรวจสอบว่ามาจากหน้า pretest หรือไม่
            const isPreTestPath = location.pathname.includes('/pretest/');
            
            // หากเป็นเส้นทาง pretest หรือมีคำสั่งให้แสดงแบบทดสอบก่อนเรียน
            if (isPreTestPath || (location.state && location.state.showPreTest)) {
              setIsPreLesson(true);
              setShowQuiz(true);
            } else {
              // ถ้าไม่ใช่ แสดงเนื้อหาบทเรียนปกติ
              setActiveTab("content");
            }
          } else {
            console.error(`Lesson with ID ${lessonIdFromUrl} not found`);
            navigate('/student/ARLearningPlatform', { replace: true });
          }
        }
        
        // Check if we're coming from a next lesson navigation
        if (location.state && location.state.nextLessonId) {
          const nextLesson = sortedLessons.find(lesson => 
            lesson.id === location.state.nextLessonId);
          if (nextLesson) {
            setSelectedLesson(nextLesson);
            
            // หากมีคำสั่งให้แสดงแบบทดสอบก่อนเรียน
            if (location.state.showPreTest) {
              setIsPreLesson(true);
              setShowQuiz(true);
            } else {
              setActiveTab("content");
            }
          }
        }
      } else {
        setError("ไม่สามารถโหลดข้อมูลบทเรียนได้");
        console.error("Invalid data format:", result);
        
        // ลองโหลดข้อมูลจาก cache ถ้ามี
        const cachedLessonsJSON = localStorage.getItem('cachedLessons');
        if (cachedLessonsJSON) {
          try {
            const cachedLessons = JSON.parse(cachedLessonsJSON);
            console.log("Loaded lessons from cache:", cachedLessons.length, "lessons");
            
            // เพิ่มคำอธิบายสำหรับคำตอบที่โหลดจากแคช
            cachedLessons.forEach(lesson => {
              // เพิ่มคำอธิบายให้แบบทดสอบหลังเรียน
              if (lesson.questions && Array.isArray(lesson.questions)) {
                lesson.questions.forEach(question => {
                  // สร้างคำอธิบายอัตโนมัติหากยังไม่มี
                  if (!question.explanation) {
                    // หาตัวเลือกที่ถูกต้อง
                    const correctOption = question.answerOptions.find(option => option.isCorrect);
                    if (correctOption) {
                      question.explanation = `คำตอบที่ถูกต้องคือ "${correctOption.answerText}" เนื่องจากเป็นข้อความที่ตรงกับเนื้อหาที่เรียน`;
                    }
                  }
                });
              }
            });
            
            setLessons(cachedLessons);
            setError(null);
            
            // แสดงข้อความเตือนว่ากำลังใช้ข้อมูลเก่า
            setToastMessage("ไม่สามารถโหลดข้อมูลใหม่ได้ กำลังใช้ข้อมูลที่บันทึกไว้");
            setToastVisible(true);
            setTimeout(() => {
              setToastVisible(false);
            }, 5000);

            await loadUserProgress(cachedLessons);
          } catch (cacheError) {
            console.error("Error loading cached lessons:", cacheError);
          }
        }
      }
    } catch (err) {
      console.error("Error loading lesson data:", err);
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง");
      
      // ลองโหลดข้อมูลจาก cache ถ้ามี
      const cachedLessonsJSON = localStorage.getItem('cachedLessons');
      if (cachedLessonsJSON) {
        try {
          const cachedLessons = JSON.parse(cachedLessonsJSON);
          console.log("Loaded lessons from cache:", cachedLessons.length, "lessons");
          
          // เพิ่มคำอธิบายสำหรับคำตอบที่โหลดจากแคชในกรณีเกิดข้อผิดพลาด
          cachedLessons.forEach(lesson => {
            // เพิ่มคำอธิบายให้แบบทดสอบหลังเรียน
            if (lesson.questions && Array.isArray(lesson.questions)) {
              lesson.questions.forEach(question => {
                // สร้างคำอธิบายอัตโนมัติหากยังไม่มี
                if (!question.explanation) {
                  // หาตัวเลือกที่ถูกต้อง
                  const correctOption = question.answerOptions.find(option => option.isCorrect);
                  if (correctOption) {
                    question.explanation = `คำตอบที่ถูกต้องคือ "${correctOption.answerText}" เนื่องจากเป็นข้อความที่ตรงกับเนื้อหาที่เรียน`;
                  }
                }
              });
            }
          });
          
          setLessons(cachedLessons);
          setError(null);
          
          // แสดงข้อความเตือนว่ากำลังใช้ข้อมูลเก่า
          setToastMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กำลังใช้ข้อมูลที่บันทึกไว้");
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 5000);

          await loadUserProgress(cachedLessons);
        } catch (cacheError) {
          console.error("Error loading cached lessons:", cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // โหลดความก้าวหน้าของผู้ใช้
  const loadUserProgress = async (lessonsData) => {
    const progress = {};
    const viewedContent = {};
    
    try {
      // เตรียมข้อมูลเริ่มต้น
      lessonsData.forEach(lesson => {
        const lessonId = lesson.id;
        
        progress[lessonId] = {
          pretestCompleted: false,
          pretestScore: null,
          posttestCompleted: false,
          posttestScore: null,
          passed: false,
          title: lesson.title,
          contentViewed: false
        };
        viewedContent[lessonId] = false;
      });
      
      // ดึงข้อมูลจากฐานข้อมูล (ถ้ามี currentUser)
      if (currentUser && currentUser.studentId) {
        const studentId = currentUser.studentId;
        
        // เรียกใช้ API เพื่อดึงข้อมูลคะแนนจากฐานข้อมูล
        const apiParams = {
          student_id: studentId
        };
        
        const result = await fetchDataFromApi(PRETEST_SCORES_API_URL, BACKUP_SCORES_API_URL, apiParams);
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
          result.data.data.forEach(item => {
            // หาบทเรียนที่ตรงกับข้อมูลในฐานข้อมูล
            const matchingLesson = lessonsData.find(lesson => 
              lesson.title === item.lesson_title || parseInt(lesson.id) === parseInt(item.lesson_id)
            );
            
            if (matchingLesson) {
              const lessonId = matchingLesson.id;
              const preTestScore = item.pre_test_score !== null ? parseInt(item.pre_test_score) : null;
              const postTestScore = item.post_test_score !== null ? parseInt(item.post_test_score) : null;
              const contentViewed = item.content_viewed === '1' || item.content_viewed === true;
              
              // อัปเดตข้อมูลใน progress
              progress[lessonId] = {
                ...progress[lessonId],
                pretestCompleted: preTestScore !== null,
                pretestScore: preTestScore,
                posttestCompleted: postTestScore !== null,
                posttestScore: postTestScore,
                passed: postTestScore >= 4,
                contentViewed: contentViewed
              };
              
              viewedContent[lessonId] = contentViewed;
              
              console.log(`Loaded progress for lesson ${matchingLesson.title} from database`, progress[lessonId]);
            }
          });
        } else {
          console.warn("Failed to fetch user progress from database, using empty progress data");
        }
      } else {
        console.log("No user ID found, using empty progress data");
      }
      
      setUserProgress(progress);
      setContentViewed(viewedContent);
      console.log("User progress loaded:", progress);
      console.log("Content viewed status:", viewedContent);
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  };

  // เพิ่มฟังก์ชันสำหรับบันทึกข้อมูลความก้าวหน้าไปยังฐานข้อมูล
  const saveProgressToDatabase = async (lessonId, data) => {
    if (!currentUser || !currentUser.studentId) {
      console.warn("Cannot save progress: No user ID found");
      return { success: false };
    }
    
    try {
      const studentId = currentUser.studentId;
      const studentName = currentUser.displayName || currentUser.firstName || studentId;
      const lesson = lessons.find(l => l.id === lessonId);
      
      if (!lesson) {
        console.warn(`Cannot save progress: Lesson with ID ${lessonId} not found`);
        return { success: false };
      }
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const progressData = {
        student_id: studentId,
        name: studentName,
        lesson_id: lessonId,
        lesson_title: lesson.title,
        ...data
      };
      
      // ส่งข้อมูลไปยัง API
      const result = await sendDataToApi(PRETEST_SCORES_API_URL, BACKUP_SCORES_API_URL, progressData);
      
      if (result.success) {
        console.log('Saved progress to database successfully:', progressData);
        // อัปเดตข้อมูลความก้าวหน้าในหน่วยความจำ
        await loadUserProgress(lessons);
        return { success: true };
      } else {
        console.warn('Failed to save progress to database:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error saving progress to database:', error);
      return { success: false, error: error.message };
    }
  };

  // ตรวจสอบว่าบทเรียนนี้ล็อคอยู่หรือไม่
  const isLessonLocked = (lesson) => {
    // ตรวจสอบว่าเป็นหน่วยการเรียนหลัก 5 หน่วยหรือไม่
    const isMainUnit = /^หน่วยที่[1-5]/.test(lesson.title);
    
    // ถ้าไม่ใช่หน่วยการเรียนหลัก ให้ไม่ล็อค
    if (!isMainUnit) {
      return false;
    }
    
    // ถ้าเป็นบทเรียนที่ไม่ต้องล็อค
    if (UNLOCKED_LESSON_TITLES.includes(lesson.title)) {
      return false;
    }
    
    // ถ้าเป็นบทเรียนแรก (ID ต่ำสุด) ให้ปลดล็อคเสมอ
    const minLessonId = Math.min(...lessons.map(l => parseInt(l.id)));
    if (parseInt(lesson.id) === minLessonId) {
      return false;
    }
    
    // ตรวจสอบว่าบทเรียนก่อนหน้านี้ผ่านหรือยัง
    const previousLessonId = findPreviousLessonId(lesson.id);
    if (!previousLessonId) return false; // ถ้าไม่มีบทเรียนก่อนหน้า ถือว่าไม่ล็อค
    
    const previousProgress = userProgress[previousLessonId];
    if (!previousProgress) return true; // ถ้าไม่มีข้อมูลความก้าวหน้า ถือว่ายังล็อคอยู่
    
    // บทเรียนจะปลดล็อคก็ต่อเมื่อบทเรียนก่อนหน้าทำแบบทดสอบหลังเรียนผ่าน (4 คะแนนขึ้นไป)
    return !(previousProgress.posttestCompleted && previousProgress.posttestScore >= 4);
  };

  // หา ID ของบทเรียนก่อนหน้า
  const findPreviousLessonId = (currentId) => {
    const currentIdInt = parseInt(currentId);
    const sortedIds = lessons.map(l => parseInt(l.id)).sort((a, b) => a - b);
    const currentIndex = sortedIds.indexOf(currentIdInt);
    
    if (currentIndex <= 0) return null; // ถ้าเป็นบทเรียนแรกหรือไม่พบ ID
    
    return sortedIds[currentIndex - 1].toString();
  };

  // ตรวจสอบว่าผู้เรียนพร้อมที่จะเริ่มเรียนบทเรียนนี้หรือไม่
  const canStartLesson = (lesson) => {
    // ตรวจสอบว่าเป็นหน่วยการเรียนหลัก 5 หน่วยหรือไม่
    const isMainUnit = /^หน่วยที่[1-5]/.test(lesson.title);
    
    // ถ้าไม่ใช่หน่วยการเรียนหลัก ให้เริ่มเรียนได้เลย
    if (!isMainUnit) {
      return true;
    }
    
    // ถ้าเป็นบทเรียนที่ไม่ต้องล็อค
    if (UNLOCKED_LESSON_TITLES.includes(lesson.title)) {
      return true;
    }
    
    const lessonProgress = userProgress[lesson.id];
    
    // ถ้าไม่มีแบบทดสอบก่อนเรียน หรือทำแบบทดสอบก่อนเรียนแล้ว สามารถเริ่มเรียนได้
    if (!lesson.preLessonQuiz || !lesson.preLessonQuiz.length || 
        (lessonProgress && lessonProgress.pretestCompleted)) {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่าผู้เรียนผ่านบทเรียนนี้หรือไม่
  const hasPassedLesson = (lessonId) => {
    const progress = userProgress[lessonId];
    if (!progress) return false;
    
    return progress.posttestCompleted && progress.posttestScore >= 4;
  };

  // เพิ่มฟังก์ชันสำหรับบันทึกสถานะการดูเนื้อหา
  const markContentAsViewed = async () => {
    if (selectedLesson) {
      try {
        // บันทึกสถานะการดูเนื้อหาลงฐานข้อมูล
        const saveResult = await saveProgressToDatabase(selectedLesson.id, {
          content_viewed: true
        });
        
        if (saveResult.success) {
          // อัปเดตสถานะใน state
          const updatedContentViewed = { ...contentViewed };
          updatedContentViewed[selectedLesson.id] = true;
          setContentViewed(updatedContentViewed);
          
          // แสดง toast notification ว่าบันทึกสำเร็จ
          setToastMessage('บันทึกสถานะการดูเนื้อหาสำเร็จ');
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 3000);
        } else {
          // แสดงข้อความแจ้งเตือนกรณีไม่สามารถบันทึกได้
          setToastMessage('ไม่สามารถบันทึกสถานะการดูเนื้อหาได้ กรุณาลองใหม่อีกครั้ง');
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 3000);
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกสถานะการดูเนื้อหา:', error);
      }
    }
  };

  // ฟังก์ชันสำหรับจัดการเมื่อแบบทดสอบเสร็จสิ้น
  const handleQuizComplete = async (lessonId, score, isPreTest) => {
    console.log(`Quiz completed: Lesson ${lessonId}, Score: ${score}, PreTest: ${isPreTest}`);
    
    // เตรียมข้อมูลสำหรับบันทึกลงฐานข้อมูล
    const progressData = isPreTest 
      ? { pre_test_score: score.toString() } 
      : { post_test_score: score.toString() };
    
    // บันทึกข้อมูลลงฐานข้อมูล
    const saveResult = await saveProgressToDatabase(lessonId, progressData);
    
    if (saveResult.success) {
      // อัปเดตข้อมูลความก้าวหน้า
      await loadUserProgress(lessons);
      
      // แสดงข้อความแจ้งเตือน
      setToastMessage(`บันทึกคะแนน${isPreTest ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'} ${score} คะแนน สำเร็จ`);
    } else {
      setToastMessage(`ไม่สามารถบันทึกคะแนน${isPreTest ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'} กรุณาลองใหม่อีกครั้ง`);
    }
    
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  // เพิ่มฟังก์ชันสำหรับบันทึกสถานะการดูเนื้อหา
  const checkForNewAndUpdatedLessons = (currentLessons) => {
    const savedLessonsJSON = localStorage.getItem('knownLessons');
    
    if (!savedLessonsJSON) {
      // ถ้าไม่มีข้อมูลที่บันทึกไว้ ให้บันทึกข้อมูลปัจจุบันแทน
      localStorage.setItem('knownLessons', JSON.stringify(currentLessons));
      return;
    }
    
    try {
      const savedLessons = JSON.parse(savedLessonsJSON);
      
      // ตรวจหาบทเรียนใหม่ (ไม่เคยมีใน savedLessons)
      const newOnes = currentLessons.filter(lesson => 
        !savedLessons.some(savedLesson => savedLesson.id === lesson.id)  
      );
      
      // ตรวจหาบทเรียนที่มีการอัปเดต
      const updatedOnes = currentLessons.filter(lesson => {
        const savedLesson = savedLessons.find(saved => saved.id === lesson.id);
        if (!savedLesson) return false; // ไม่พบในบทเรียนเก่า = เป็นบทเรียนใหม่ (ไม่ใช่อัปเดต)
        
        // เปรียบเทียบเนื้อหาและคำถาม
        const contentChanged = lesson.content !== savedLesson.content;
        const titleChanged = lesson.title !== savedLesson.title;
        const descriptionChanged = lesson.description !== savedLesson.description;
        const arLinkChanged = lesson.arLink !== savedLesson.arLink;
        
        // ตรวจสอบการเปลี่ยนแปลงของคำถาม
        let questionsChanged = false;
        
        // ตรวจสอบว่ามีคำถามหรือไม่
        const lessonHasQuestions = lesson.questions && Array.isArray(lesson.questions);
        const savedHasQuestions = savedLesson.questions && Array.isArray(savedLesson.questions);
        
        // ถ้าจำนวนคำถามต่างกัน หรือฝั่งหนึ่งมีคำถามแต่อีกฝั่งไม่มี
        if (lessonHasQuestions !== savedHasQuestions) {
          questionsChanged = true;
        } else if (lessonHasQuestions && savedHasQuestions) {
          // ถ้าจำนวนคำถามต่างกัน
          if (lesson.questions.length !== savedLesson.questions.length) {
            questionsChanged = true;
          } else {
            // ตรวจสอบเนื้อหาของคำถาม
            for (let i = 0; i < lesson.questions.length; i++) {
              if (
                lesson.questions[i].questionText !== savedLesson.questions[i].questionText ||
                JSON.stringify(lesson.questions[i].answerOptions) !== JSON.stringify(savedLesson.questions[i].answerOptions)
              ) {
                questionsChanged = true;
                break;
              }
            }
          }
        }
        
        // ตรวจสอบการเปลี่ยนแปลงของแบบทดสอบก่อนเรียน
        let preLessonQuizChanged = false;
        
        // ตรวจสอบว่ามีแบบทดสอบก่อนเรียนหรือไม่
        const lessonHasPreQuiz = lesson.preLessonQuiz && Array.isArray(lesson.preLessonQuiz);
        const savedHasPreQuiz = savedLesson.preLessonQuiz && Array.isArray(savedLesson.preLessonQuiz);
        
        // ถ้าฝั่งหนึ่งมีแบบทดสอบก่อนเรียนแต่อีกฝั่งไม่มี
        if (lessonHasPreQuiz !== savedHasPreQuiz) {
          preLessonQuizChanged = true;
        } else if (lessonHasPreQuiz && savedHasPreQuiz) {
          // ถ้าจำนวนคำถามต่างกัน
          if (lesson.preLessonQuiz.length !== savedLesson.preLessonQuiz.length) {
            preLessonQuizChanged = true;
          } else {
            // ตรวจสอบเนื้อหาของคำถาม
            for (let i = 0; i < lesson.preLessonQuiz.length; i++) {
              if (
                lesson.preLessonQuiz[i].questionText !== savedLesson.preLessonQuiz[i].questionText ||
                JSON.stringify(lesson.preLessonQuiz[i].answerOptions) !== JSON.stringify(savedLesson.preLessonQuiz[i].answerOptions)
              ) {
                preLessonQuizChanged = true;
                break;
              }
            }
          }
        }
        
        // เพิ่มข้อมูลรายละเอียดการอัปเดตในแต่ละบทเรียน
        if (contentChanged || titleChanged || descriptionChanged || arLinkChanged || questionsChanged || preLessonQuizChanged) {
          // สร้างอ็อบเจ็กต์ที่เก็บรายละเอียดการอัปเดต
          lesson.updateDetails = {
            contentChanged,
            titleChanged,
            descriptionChanged,
            arLinkChanged,
            questionsChanged,
            preLessonQuizChanged
          };
          
          // เพิ่มคำอธิบายการเปลี่ยนแปลงสำหรับแสดงในการแจ้งเตือน
          lesson.updateDescription = [];
          if (titleChanged) lesson.updateDescription.push('ชื่อบทเรียน');
          if (descriptionChanged) lesson.updateDescription.push('คำอธิบาย');
          if (contentChanged) lesson.updateDescription.push('เนื้อหา');
          if (arLinkChanged) lesson.updateDescription.push('ลิงก์ AR');
          if (questionsChanged) lesson.updateDescription.push('แบบทดสอบหลังเรียน');
          if (preLessonQuizChanged) lesson.updateDescription.push('แบบทดสอบก่อนเรียน');
          
          return true;
        }
        
        return false;
      });
      
      setNewLessons(newOnes);
      setUpdatedLessons(updatedOnes);
      
      // จัดเก็บประวัติการแจ้งเตือนที่จำเป็นเท่านั้น
      const notificationHistory = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
      const currentDate = new Date().toISOString();
      
      if (newOnes.length > 0 || updatedOnes.length > 0) {
        // บันทึกประวัติการแจ้งเตือน
        const newNotification = {
          date: currentDate,
          newLessons: newOnes.map(lesson => ({
            id: lesson.id,
            title: lesson.title
          })),
          updatedLessons: updatedOnes.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            changes: lesson.updateDescription
          }))
        };
        
        // เพิ่มการแจ้งเตือนใหม่เข้าไปในประวัติ (เก็บไว้ไม่เกิน 10 รายการ)
        notificationHistory.unshift(newNotification);
        if (notificationHistory.length > 10) {
          notificationHistory.pop();
        }
        
        localStorage.setItem('notificationHistory', JSON.stringify(notificationHistory));
        
        // สร้างข้อความแจ้งเตือน
        let message = "";
        if (newOnes.length > 0) {
          message += `มีบทเรียนใหม่ ${newOnes.length} บท${newOnes.length > 2 ? '' : `: ${newOnes.map(l => l.title).join(', ')}`} `;
        }
        if (updatedOnes.length > 0) {
          message += `${newOnes.length > 0 ? 'และ ' : ''}มีบทเรียนที่อัปเดต ${updatedOnes.length} บท${updatedOnes.length > 2 ? '' : `: ${updatedOnes.map(l => l.title).join(', ')}`}`;
        }
        
        // แสดงการแจ้งเตือนแบบชั่วคราว
        setToastMessage(message);
        setToastVisible(true);
        
        // ตั้งเวลาให้ปิดการแจ้งเตือนหลังจาก 7 วินาที
        setTimeout(() => {
          setToastVisible(false);
        }, 7000);
      }
      
      // บันทึกข้อมูลบทเรียนปัจจุบัน
      localStorage.setItem('knownLessons', JSON.stringify(currentLessons));
    } catch (error) {
      console.error("Error checking for lesson updates:", error);
      // บันทึกข้อมูลบทเรียนปัจจุบันในกรณีที่เกิดข้อผิดพลาด
      localStorage.setItem('knownLessons', JSON.stringify(currentLessons));
    }
  };

  const toggleNotificationDetails = () => {
    setShowNotificationDetails(!showNotificationDetails);
  };

  const closeNotification = () => {
    setToastVisible(false);
  };

  const handleOpenQuiz = (isPreTest = false) => {
    // ถ้าเป็นแบบทดสอบก่อนเรียนและผู้ใช้ทำไปแล้ว ให้ไม่อนุญาตให้ทำซ้ำ
    if (isPreTest && selectedLesson && userProgress[selectedLesson.id] && 
        userProgress[selectedLesson.id].pretestCompleted) {
      alert("คุณได้ทำแบบทดสอบก่อนเรียนนี้ไปแล้ว ไม่สามารถทำซ้ำได้");
      return;
    }
    
    // ถ้าเป็นแบบทดสอบหลังเรียนและผู้ใช้ยังไม่ได้ดูเนื้อหา
    if (!isPreTest && selectedLesson && (!contentViewed[selectedLesson.id])) {
      alert("คุณต้องเรียนเนื้อหาก่อนที่จะทำแบบทดสอบหลังเรียน");
      setActiveTab("content"); // บังคับให้กลับไปที่แท็บเนื้อหา
      return;
    }
    
    window.history.pushState({ inQuiz: true }, "", window.location.pathname);
    setIsPreLesson(isPreTest);
    setShowQuiz(true);
  };

  const handleBackToLessons = () => {
    setActiveTab("lessons");
    setSelectedLesson(null);
  };

  const handleLogout = () => {
    if (window.confirm("ต้องการออกจากระบบหรือไม่?")) {
      // ล้างเฉพาะข้อมูลการเข้าสู่ระบบและแคช แต่ไม่ล้างข้อมูลความก้าวหน้า
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      // ยังคงเก็บ cachedLessons และ knownLessons ไว้สำหรับกรณีไม่มีอินเทอร์เน็ต
      navigate("/auth", { replace: true });  
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())  
  );

  // คอมโพเนนต์แสดงสถานะการล็อค/ปลดล็อคบทเรียน
  const LessonStatusIndicator = ({ lesson }) => {
    if (isLessonLocked(lesson)) {
      return <div className="lock-indicator"><i className="fas fa-lock"></i> ล็อค</div>;
    }
    
    if (hasPassedLesson(lesson.id)) {
      return <div className="completed-indicator"><i className="fas fa-check-circle"></i> ผ่านแล้ว</div>;
    }
    
    if (!canStartLesson(lesson)) {
      return <div className="pretest-required-indicator"><i className="fas fa-exclamation-circle"></i> ต้องทำแบบทดสอบก่อนเรียน</div>;
    }
    
    return <div className="unlocked-indicator"><i className="fas fa-unlock"></i> พร้อมเรียน</div>;
  };

  // คอมโพเนนต์แสดงการแจ้งเตือนแบบชั่วคราว (Toast)
  const ToastNotification = () => {
    if (!toastVisible) return null;
    
    return (
      <div className="toast-notification">
        <div className="toast-content">
          <i className="fas fa-bell toast-icon"></i>
          <div className="toast-message">{toastMessage}</div>
          <button className="toast-close" onClick={closeNotification}>×</button>
        </div>
        <div className="toast-actions">
          <button 
            className="toast-view-btn"
            onClick={() => {
              closeNotification();
              setActiveTab("lessons");
              setSelectedLesson(null);
            }}
          >
            <i className="fas fa-eye"></i> ดูบทเรียน
          </button>
          <button 
            className="toast-details-btn"
            onClick={toggleNotificationDetails}
          >
            <i className="fas fa-info-circle"></i> ดูรายละเอียด
          </button>
        </div>
      </div>
    );
  };

  // เพิ่มคอมโพเนนต์แสดงรายละเอียดการแจ้งเตือน
  const NotificationDetails = () => {
    const [notificationHistory, setNotificationHistory] = useState([]);
    
    useEffect(() => {
      const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
      setNotificationHistory(history);
    }, [showNotificationDetails]);
    
    if (!showNotificationDetails) return null;
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH')}`;
    };
    
    return (
      <div className="notification-details-modal">
        <div className="notification-details-content">
          <div className="notification-details-header">
            <h2>ประวัติการแจ้งเตือน</h2>
            <button className="close-btn" onClick={toggleNotificationDetails}>×</button>
          </div>
          
          <div className="notification-details-body">
            {notificationHistory.length === 0 ? (
              <p className="no-notifications">ไม่พบประวัติการแจ้งเตือน</p>
            ) : (
              notificationHistory.map((notification, index) => (
                <div key={index} className="notification-item">
                  <div className="notification-date">{formatDate(notification.date)}</div>
                  
                  {notification.newLessons.length > 0 && (
                    <div className="new-lessons-section">
                      <h3>บทเรียนใหม่ ({notification.newLessons.length})</h3>
                      <ul>
                        {notification.newLessons.map((lesson, i) => (
                          <li key={i}>
                            <button 
                              className="notification-lesson-link"
                              onClick={() => {
                                toggleNotificationDetails();
                                const lessonToSelect = lessons.find(l => l.id === lesson.id);
                                if (lessonToSelect) {
                                  handleLessonSelect(lessonToSelect);
                                }
                              }}
                            >
                              {lesson.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {notification.updatedLessons.length > 0 && (
                    <div className="updated-lessons-section">
                      <h3>บทเรียนที่อัปเดต ({notification.updatedLessons.length})</h3>
                      <ul>
                        {notification.updatedLessons.map((lesson, i) => (
                          <li key={i}>
                            <button 
                              className="notification-lesson-link"
                              onClick={() => {
                                toggleNotificationDetails();
                                const lessonToSelect = lessons.find(l => l.id === lesson.id);
                                if (lessonToSelect) {
                                  handleLessonSelect(lessonToSelect);
                                }
                              }}
                            >
                              {lesson.title}
                            </button>
                            {lesson.changes && lesson.changes.length > 0 && (
                              <div className="change-details">
                                การเปลี่ยนแปลง: {lesson.changes.join(', ')}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // แก้ไขฟังก์ชัน handleLessonSelect เพื่อตรวจสอบสถานะการล็อคและการทำแบบทดสอบก่อนเรียน
  const handleLessonSelect = (lesson) => {
    // ตรวจสอบว่าบทเรียนนี้ล็อคอยู่หรือไม่
    if (isLessonLocked(lesson)) {
      alert(`บทเรียน "${lesson.title}" ยังไม่ปลดล็อค คุณต้องผ่านบทเรียนก่อนหน้านี้ก่อน`);
      return;
    }
    
    setSelectedLesson(lesson);
    
    // ตรวจสอบว่าต้องทำแบบทดสอบก่อนเรียนก่อนหรือไม่
    if (lesson.preLessonQuiz && lesson.preLessonQuiz.length > 0 && !canStartLesson(lesson)) {
      // ถ้ามีแบบทดสอบก่อนเรียนและยังไม่ได้ทำ ให้เปิดแบบทดสอบก่อนเรียนทันที
      setIsPreLesson(true);
      setShowQuiz(true);
      return;
    }
    
    // ถ้าไม่มีแบบทดสอบก่อนเรียนหรือทำแล้ว ไปที่หน้าเนื้อหา
    setActiveTab("content");
    setShowQuiz(false);
    setIsPreLesson(false);
  };

  const handleCloseQuiz = async () => {
    setShowQuiz(false);
    
    // หลังจากทำแบบทดสอบก่อนเรียนเสร็จ ให้แสดงเนื้อหาบทเรียน
    if (isPreLesson) {
      // อัปเดตข้อมูลความก้าวหน้า
      await loadUserProgress(lessons);
      // แสดงเนื้อหาบทเรียนทันที (บังคับให้ไปที่หน้าเนื้อหา)
      setActiveTab("content");
      setIsPreLesson(false);
    } else {
      // หลังจากทำแบบทดสอบหลังเรียน อัปเดตข้อมูลความก้าวหน้า
      await loadUserProgress(lessons);
    }
  };

  // ตรวจสอบการเชื่อมโยงไปยังบทเรียนถัดไป ถ้าผ่านบทเรียนนี้แล้ว
  const handleNextLesson = (lesson) => {
    if (userProgress[lesson.id] && userProgress[lesson.id].passed) {
      handleLessonSelect(lesson);
    } else {
      alert("คุณต้องทำแบบทดสอบหลังเรียนให้ได้อย่างน้อย 4 คะแนนเพื่อปลดล็อคบทเรียนถัดไป");
      setActiveTab("content");
    }
  };

  // ตรวจสอบการเชื่อมต่อกับ API และโหลดข้อมูล
  useEffect(() => {
    const initializeApp = async () => {
      // ตรวจสอบการเชื่อมต่อกับ API
      const isApiConnected = await checkApiConnection(API_URL);
      setApiConnected(isApiConnected);
      
      if (isApiConnected) {
        console.log("API connection successful, loading lessons");
        fetchLessons();
      } else {
        console.warn("API connection failed, trying to load from cache");
        // ลองโหลดข้อมูลจาก cache ถ้ามี
        const cachedLessonsJSON = localStorage.getItem('cachedLessons');
        if (cachedLessonsJSON) {
          try {
            const cachedLessons = JSON.parse(cachedLessonsJSON);
            console.log("Loaded lessons from cache:", cachedLessons.length, "lessons");
            
            setLessons(cachedLessons);
            checkForNewAndUpdatedLessons(cachedLessons);
            await loadUserProgress(cachedLessons);
            
            // Handle direct navigation to a lesson by ID
            if (lessonIdFromUrl) {
              const lessonToSelect = cachedLessons.find(lesson => lesson.id === lessonIdFromUrl);
              if (lessonToSelect) {
                setSelectedLesson(lessonToSelect);
                
                // ตรวจสอบว่ามาจากหน้า pretest หรือไม่
                const isPreTestPath = location.pathname.includes('/pretest/');
                
                // หากเป็นเส้นทาง pretest หรือมีคำสั่งให้แสดงแบบทดสอบก่อนเรียน
                if (isPreTestPath || (location.state && location.state.showPreTest)) {
                  setIsPreLesson(true);
                  setShowQuiz(true);
                } else {
                  // ถ้าไม่ใช่ แสดงเนื้อหาบทเรียนปกติ
                  setActiveTab("content");
                }
              } else {
                console.error(`Lesson with ID ${lessonIdFromUrl} not found in cache`);
                navigate('/student/ARLearningPlatform', { replace: true });
              }
            }
            
            setLoading(false);
            // แสดงข้อความเตือนว่ากำลังใช้ข้อมูลออฟไลน์
            setToastMessage("กำลังใช้ข้อมูลออฟไลน์ การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว");
            setToastVisible(true);
            setTimeout(() => {
              setToastVisible(false);
            }, 5000);
          } catch (error) {
            console.error("Error loading cached lessons:", error);
            setError("ไม่สามารถโหลดข้อมูลบทเรียนจากแคชได้");
            setLoading(false);
          }
        } else {
          setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์และไม่พบข้อมูลในแคช");
          setLoading(false);
        }
      }
    };
    
    initializeApp();
  }, [lessonIdFromUrl, navigate, location.state, location.pathname]);

  // เมื่ออยู่ในโหมดทำแบบทดสอบ
  if (showQuiz && selectedLesson) {
    return (
      <div>
        <Navbar activePage="arlearning" onLogout={handleLogout} />
        <div className="main-content">
          <LessonQuiz 
            lessonId={selectedLesson.id} 
            quizData={{
              questions: isPreLesson ? selectedLesson.preLessonQuiz || [] : selectedLesson.questions || [],
              lessonId: selectedLesson.id,
              lessonTitle: selectedLesson.title
            }} 
            isPreLesson={isPreLesson}
            onClose={handleCloseQuiz}
            onComplete={handleQuizComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar activePage="arlearning" onLogout={handleLogout} />
      
      <div className="main-content">
        <ToastNotification />
        <NotificationDetails />
        
        <div className="container">
          {activeTab === "lessons" && (
            <div className="welcome-screen">
              <h1>ระบบการเรียนรู้เสมือนจริง AR</h1>
              <p>เรียนรู้ด้วยเทคโนโลยีความจริงเสริม</p>
              <div className="learning-flow-guide">
                <p>ขั้นตอนการเรียนรู้:</p>
                <ol>
                  <li>ทำแบบทดสอบก่อนเรียน</li>
                  <li>ศึกษาเนื้อหาบทเรียน</li>
                  <li>ทำแบบทดสอบหลังเรียน (ต้องได้ 4 คะแนนขึ้นไปจึงจะผ่าน)</li>
                </ol>
                
              </div>
              
              <div className="notification-history-section">
                <button onClick={toggleNotificationDetails} className="notification-history-btn">
                  <i className="fas fa-bell"></i> ประวัติการแจ้งเตือน
                </button>
              </div>
            </div>
          )}
          
          <div className="content-wrapper">
            {activeTab === "lessons" && (
              <div>
                <div className="tab-navigation">
                  <button 
                    onClick={() => setActiveTab("lessons")} 
                    className={`tab-button ${activeTab === "lessons" ? "active" : ""}`}
                  >
                    บทเรียน
                  </button>
                  <button 
                    onClick={() => setActiveTab("content")} 
                    disabled={!selectedLesson} 
                    className={`tab-button ${activeTab === "content" && selectedLesson ? "active" : ""}`}
                  >
                    เนื้อหา
                  </button>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="ค้นหาบทเรียน"
                    value={searchTerm}
                    onChange={handleSearch}
                    aria-label="ค้นหาบทเรียน"
                  />
                </div>

                {loading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <div className="loading-text">กำลังโหลดบทเรียน...</div>
                  </div>
                ) : error ? (
                  <div className="error-container">
                    <h3>เกิดข้อผิดพลาด</h3>
                    <p>{error}</p>
                    <button onClick={fetchLessons}><i className="fas fa-sync-alt"></i> ลองอีกครั้ง</button>
                  </div>
                ) : (
                  <div className="lessons-grid">
                    {filteredLessons.map((lesson, index) => {
                      // ตรวจสอบสถานะบทเรียน
                      const isCompleted = userProgress[lesson.id] && userProgress[lesson.id].posttestCompleted && userProgress[lesson.id].posttestScore >= 4;
                      const isMainUnit = /^หน่วยที่[1-5]/.test(lesson.title);
                      const isUnlocked = !isMainUnit || index === 0 || 
                                        UNLOCKED_LESSON_TITLES.includes(lesson.title) || 
                                        (userProgress[lessons[index-1]?.id] && userProgress[lessons[index-1]?.id].posttestCompleted && userProgress[lessons[index-1]?.id].posttestScore >= 4);
                      const preTestScore = userProgress[lesson.id]?.pretestScore;
                      const postTestScore = userProgress[lesson.id]?.posttestScore;
                      const isNew = newLessons.some(l => l.id === lesson.id);
                      const isUpdated = updatedLessons.some(l => l.id === lesson.id);
                      
                      // กำหนดชื่อคลาสตามสถานะ
                      let cardClassName = "lesson-card";
                      if (isCompleted) cardClassName += " completed-lesson";
                      if (!isUnlocked) cardClassName += " locked-lesson";
                      if (isNew) cardClassName += " new-lesson";
                      if (isUpdated) cardClassName += " updated-lesson";

                      return (
                        <div
                          key={lesson.id}
                          className={cardClassName}
                          onClick={() => {
                            if (isUnlocked) handleLessonSelect(lesson);
                          }}
                        >
                          {isNew && <span className="new-badge">ใหม่</span>}
                          {isUpdated && <span className="updated-badge">อัปเดต</span>}
                          
                          <h3>{lesson.title}</h3>
                          <p>{lesson.description}</p>
                          
                          {/* แสดงสถานะของบทเรียน */}
                          {!isUnlocked ? (
                            <div className="lock-indicator">
                              <i className="fas fa-lock"></i> ยังไม่สามารถเรียนได้
                            </div>
                          ) : isCompleted ? (
                            <div className="completed-indicator">
                              <i className="fas fa-check-circle"></i> เรียนจบแล้ว
                            </div>
                          ) : userProgress[lesson.id] ? (
                            <div className="unlocked-indicator">
                              <i className="fas fa-book-open"></i> กำลังเรียน
                            </div>
                          ) : (
                            <div className="pretest-required-indicator">
                              <i className="fas fa-exclamation-circle"></i> ต้องทำแบบทดสอบก่อนเรียน
                            </div>
                          )}
                          
                          {/* ข้อมูลเพิ่มเติมของบทเรียน */}
                          <div className="meta">
                            <span><i className="fas fa-clock"></i> {lesson.duration} {lesson.duration ? 'นาที' : ''}</span>
                            {userProgress[lesson.id] && userProgress[lesson.id].pretestCompleted && (
                              <span className="pre-quiz-info">ทำแบบทดสอบก่อนเรียนแล้ว</span>
                            )}
                          </div>
                          
                          {/* แสดงคะแนนสอบ */}
                          {(preTestScore !== undefined || postTestScore !== undefined) && (
                            <div className="lesson-progress">
                              {preTestScore !== undefined && preTestScore !== null && (
                                <div className="pretest-score">
                                  <i className="fas fa-pen"></i> คะแนนก่อนเรียน: {preTestScore}/5
                                </div>
                              )}
                              {postTestScore !== undefined && postTestScore !== null && (
                                <div className="posttest-score">
                                  <i className="fas fa-check"></i> คะแนนหลังเรียน: {postTestScore}/5
                                </div>
                              )}
                            </div>
                          )}
                          
                          <button
                            className={!isUnlocked ? "disabled-button" : ""}
                            disabled={!isUnlocked}
                            >
                             {isCompleted ? 
                               <><i className="fas fa-sync-alt"></i> ทบทวนบทเรียน</> : 
                               isUnlocked ? 
                                 <><i className="fas fa-play-circle"></i> เริ่มเรียน</> : 
                                 <><i className="fas fa-lock"></i> ยังไม่สามารถเรียนได้</>
                             }
                           </button>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             )}

             {activeTab === "content" && selectedLesson && (
               <div className="lesson-content">
                 <h2>{selectedLesson.title}</h2>
                 
                 <div className="content-grid">
                   {/* ส่วนแบบทดสอบก่อนเรียน */}
                   {selectedLesson.preLessonQuiz && selectedLesson.preLessonQuiz.length > 0 && (
                     <div className="content-section pre-lesson-quiz-section">
                     <h3>แบบทดสอบก่อนเรียน</h3>
                     <p>สำหรับการวัดความรู้พื้นฐานก่อนเรียนเนื้อหานี้</p>
                     <p className="meta">แบบทดสอบนี้มี {selectedLesson.preLessonQuiz.length} คำถาม และคะแนนของคุณจะถูกบันทึกโดยอัตโนมัติ</p>
                     
                     {/* ตรวจสอบว่าทำแบบทดสอบก่อนเรียนไปแล้วหรือไม่ */}
                     {userProgress[selectedLesson.id] && userProgress[selectedLesson.id].pretestCompleted ? (
                       <div className="pre-test-completed">
                         <p>คุณได้ทำแบบทดสอบก่อนเรียนสำหรับบทเรียนนี้แล้ว</p>
                         <p>คะแนน: {userProgress[selectedLesson.id].pretestScore || 0} / {selectedLesson.preLessonQuiz.length}</p>
                         <p className="alert-message">คุณไม่สามารถทำแบบทดสอบก่อนเรียนซ้ำได้</p>
                       </div>
                     ) : (
                       <button 
                         onClick={() => handleOpenQuiz(true)} 
                         className="primary-button pre-test-button"
                       >
                         <i className="fas fa-pen-alt"></i> ทำแบบทดสอบก่อนเรียน
                       </button>
                     )}
                   </div>
                 )}
                 
                 <div className="content-section">
                   <h3>เนื้อหาบทเรียน</h3>
                   <p className="whitespace-pre-line">{selectedLesson.content}</p>
                   {selectedLesson.arLink && (
                     <button 
                       onClick={() => { 
                         markContentAsViewed(); // เมื่อคลิกเปิดเนื้อหา AR ให้บันทึกว่าได้ดูเนื้อหาแล้ว
                         window.open(selectedLesson.arLink, '_blank'); 
                       }} 
                       className="primary-button"
                     >
                       <i className="fas fa-cube"></i> เปิดเนื้อหา AR
                     </button>
                   )}
                   
                   {/* เพิ่มปุ่มสำหรับทำเครื่องหมายว่าได้เรียนเนื้อหาแล้ว */}
                   <button 
                     onClick={markContentAsViewed} 
                     className={`mark-as-read-button ${contentViewed[selectedLesson?.id] ? 'read-already' : ''}`}
                     disabled={contentViewed[selectedLesson?.id]}
                   >
                     {contentViewed[selectedLesson?.id] ? 
                       'คุณได้เรียนเนื้อหานี้แล้ว' : 
                       <><i className="fas fa-book-reader"></i> ทำเครื่องหมายว่าได้เรียนแล้ว</>
                     }
                   </button>
                 </div>
                 
                 <div className="content-section">
                   <h3>แบบทดสอบหลังเรียน</h3>
                   {selectedLesson.questions && selectedLesson.questions.length > 0 ? (
                     <>
                       <p>คลิกปุ่มด้านล่างเพื่อทำแบบทดสอบสำหรับบทเรียนนี้</p>
                       <p className="meta">แบบทดสอบนี้มี {selectedLesson.questions.length} คำถาม คุณต้องได้อย่างน้อย 4 คะแนนจึงจะผ่าน</p>
                       
                       {/* แสดงข้อความเตือนถ้ายังไม่ได้เรียนเนื้อหา */}
                       {!contentViewed[selectedLesson.id] && (
                         <div className="warning-message">
                           <p>คุณต้องเรียนเนื้อหาบทเรียนนี้ก่อนที่จะทำแบบทดสอบหลังเรียน</p>
                         </div>
                       )}
                       
                       {/* แสดงสถานะการทำแบบทดสอบหลังเรียน */}
                       {userProgress[selectedLesson.id] && userProgress[selectedLesson.id].posttestCompleted && (
                         <div className="post-test-status">
                           <p>คะแนนล่าสุดของคุณ: {userProgress[selectedLesson.id].posttestScore} / {selectedLesson.questions.length}</p>
                           <p>สถานะ: {userProgress[selectedLesson.id].posttestScore >= 4 ? (
                             <span className="passed-status">ผ่าน ✓</span>
                           ) : (
                             <span className="failed-status">ไม่ผ่าน ✗ (ต้องได้อย่างน้อย 4 คะแนน)</span>
                           )}</p>
                         </div>
                       )}
                       
                       <button 
                         onClick={() => handleOpenQuiz(false)} 
                         className={contentViewed[selectedLesson.id] ? "success-button" : "disabled-button"}
                         disabled={!contentViewed[selectedLesson.id]}
                       >
                         {userProgress[selectedLesson.id] && userProgress[selectedLesson.id].posttestCompleted ? 
                           <><i className="fas fa-redo"></i> ทำแบบทดสอบหลังเรียนอีกครั้ง</> : 
                           <><i className="fas fa-clipboard-check"></i> ทำแบบทดสอบหลังเรียน</>}
                       </button>
                     </>
                   ) : (
                     <p className="text-gray-500">ไม่มีแบบทดสอบหลังเรียนสำหรับบทเรียนนี้</p>
                   )}
                 </div>
                 
                 {/* แสดงคำแนะนำถ้ายังไม่ผ่านบทเรียนนี้ */}
                 {selectedLesson.questions && selectedLesson.questions.length > 0 && 
                  (!userProgress[selectedLesson.id] || !userProgress[selectedLesson.id].passed) && (
                   <div className="content-section hint-section">
                     <h3>คำแนะนำ</h3>
                     <p>คุณต้องทำแบบทดสอบหลังเรียนให้ได้อย่างน้อย 4 คะแนนเพื่อปลดล็อคบทเรียนถัดไป</p>
                     <p>โปรดอ่านเนื้อหาให้เข้าใจก่อนทำแบบทดสอบ</p>
                   </div>
                 )}
                 
                 {/* แสดงการเชื่อมโยงไปยังบทเรียนถัดไป ถ้าผ่านบทเรียนนี้แล้ว */}
                 {userProgress[selectedLesson.id] && userProgress[selectedLesson.id].passed && (
                   <div className="content-section next-lesson-section">
                     <h3>บทเรียนถัดไป</h3>
                     {(() => {
                       const nextLessonId = parseInt(selectedLesson.id) + 1;
                       const nextLesson = lessons.find(lesson => parseInt(lesson.id) === nextLessonId);
                       
                       if (nextLesson) {
                         const isNextLessonLocked = isLessonLocked(nextLesson);
                         
                         return (
                           <>
                             <p>คุณผ่านบทเรียนนี้แล้ว! สามารถเรียนบทต่อไปได้</p>
                             <button 
                               onClick={() => handleNextLesson(nextLesson)}
                               disabled={isNextLessonLocked}
                               className={isNextLessonLocked ? "disabled-button" : "primary-button"}
                             >
                               <i className="fas fa-arrow-right"></i> ไปยังบทเรียนถัดไป: {nextLesson.title}
                             </button>
                           </>
                         );
                       } else {
                         return <p>ยินดีด้วย! คุณได้เรียนจบบทเรียนทั้งหมดแล้ว</p>;
                       }
                     })()}
                   </div>
                 )}
               </div>
               
               <div className="button-container">
                 <button 
                   onClick={handleBackToLessons} 
                   className="back-button"
                 >
                   กลับไปยังบทเรียน
                 </button>
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   </div>
 );
};

export default ARLearningPlatform;