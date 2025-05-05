import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TeacherLayout from "../components/TeacherLayout";
import "../styles03/TeacherLessonManager.css";
import TeacherProfileIcon from '../ProfileAllUser/TeacherProfileIcon';
import { useAuth } from '../component01/AuthContext';

// กำหนด URL ของ API
const API_URL = "http://mgt2.pnu.ac.th/safirde/lessons_db/lessons_api.php";
const AR_API_URL = "http://mgt2.pnu.ac.th/safirde/ar_content_db/get_ar_links.php"; // API URL สำหรับดึงข้อมูล AR links

// กำหนดอีเมลของผู้ดูแลระบบที่สามารถจัดการทุกบทเรียนได้
const ADMIN_EMAIL = "niyakadee165@gmail.com";

const TeacherLessonManager = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [editingLesson, setEditingLesson] = useState(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    arLink: '',
    content: '',
    createdBy: '',  // เพิ่มฟิลด์ createdBy เพื่อเก็บอีเมลของผู้สร้างบทเรียน
    preLessonQuiz: [] // เพิ่มฟิลด์สำหรับแบบทดสอบก่อนเรียน
  });
  const [activeTab, setActiveTab] = useState('lessons');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isAuthorizedTeacher } = useAuth();
  
  // เพิ่ม state สำหรับเก็บลิงก์ AR และการแสดงรายการ dropdown
  const [arLinks, setArLinks] = useState([]);
  const [showArLinksList, setShowArLinksList] = useState(false);
  const [arLinksLoading, setArLinksLoading] = useState(false);
  const [arLinksError, setArLinksError] = useState(null);

  // Apply custom scrollbar styling
  useEffect(() => {
    // Target elements that need custom scrollbars
    const lessonManager = document.querySelector('.lesson-manager');
    const arLinksDropdown = document.querySelector('.ar-links-dropdown');
    const dashboardContent = document.querySelector('.dashboard-content');
    
    // Apply scrollbar styles
    const applyScrollbarStyles = () => {
      // Set basic overflow properties if elements exist
      if (lessonManager) {
        lessonManager.style.overflowY = 'visible';
        lessonManager.style.scrollbarWidth = 'thin';
        lessonManager.style.paddingRight = '0';
        lessonManager.style.height = 'auto';
        lessonManager.style.minHeight = '100%';
      }
      
      if (dashboardContent) {
        dashboardContent.style.overflowY = 'auto';
        dashboardContent.style.height = 'auto';
        dashboardContent.style.minHeight = '100vh';
      }
      
      // Apply custom scrollbar styles through CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .dashboard-content::-webkit-scrollbar {
          width: 8px;
          position: absolute;
          right: 0;
        }
        
        .dashboard-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .dashboard-content::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
          border: 2px solid #f1f5f9;
        }
        
        .dashboard-content::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .ar-links-dropdown::-webkit-scrollbar {
          width: 6px;
          position: absolute;
          right: 0;
        }
        
        .ar-links-dropdown::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        
        .ar-links-dropdown::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
          border: 1px solid #f8fafc;
        }
        
        .ar-links-dropdown::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .modal-content {
          max-height: 70vh;
          overflow-y: auto;
        }
      `;
      document.head.appendChild(styleElement);
    };
    
    // Apply styles
    applyScrollbarStyles();
    
    // Setup mutation observer to handle AR dropdown being added later
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const addedArDropdown = document.querySelector('.ar-links-dropdown');
          if (addedArDropdown) {
            addedArDropdown.style.overflowY = 'auto';
            addedArDropdown.style.scrollbarWidth = 'thin';
            addedArDropdown.style.paddingRight = '0';
          }
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Cleanup
    return () => {
      // Remove any added styles when component unmounts
      const styleElement = document.head.querySelector('style:last-child');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
      observer.disconnect();
    };
  }, []);

  // เพิ่มฟังก์ชันตรวจสอบว่าผู้ใช้มีสิทธิ์จัดการบทเรียนนี้หรือไม่
  const canManageLesson = (lesson) => {
    // ถ้าไม่มีข้อมูลผู้ใช้หรือบทเรียน
    if (!currentUser || !lesson) return false;
    
    // ถ้าเป็นผู้ดูแลระบบ (admin) ให้จัดการได้ทุกบทเรียน
    if (currentUser.email === ADMIN_EMAIL) return true;
    
    // ถ้าเป็นเจ้าของบทเรียน (ตรวจสอบจากฟิลด์ createdBy)
    return lesson.createdBy === currentUser.email;
  };

  // ตรวจสอบสิทธิ์เมื่อโหลดคอมโพเนนต์
  useEffect(() => {
    if (currentUser) {
      // อัปเดต newLesson โดยเพิ่ม createdBy เป็นอีเมลของผู้ใช้ปัจจุบัน
      setNewLesson(prev => ({
        ...prev,
        createdBy: currentUser.email
      }));
    }
  }, [currentUser]);
  
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching lessons from:", `${API_URL}/lessons`);
      
      const response = await fetch(`${API_URL}/lessons`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      // แปลงข้อความเป็น JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (result && result.status === 'success' && result.data) {
        // ตรวจสอบว่าได้รับอาร์เรย์ข้อมูลที่ถูกต้อง
        const lessonsData = Array.isArray(result.data) ? result.data : [];
        
        // ตรวจสอบและอัปเดตข้อมูล fields ที่ไม่มีค่าให้เป็นค่าเริ่มต้น
        const processedLessons = lessonsData.map(lesson => ({
          ...lesson,
          title: lesson.title || '',
          description: lesson.description || '',
          arLink: lesson.arLink || '',
          content: lesson.content || '',
          questions: lesson.questions || [],
          preLessonQuiz: lesson.preLessonQuiz || [],
          createdBy: lesson.createdBy || ''
        }));
        
        setLessons(processedLessons);
        // อัปเดต filteredLessons ด้วยฟังก์ชัน filterLessons
        filterLessons(processedLessons, searchTerm);
      } else {
        console.error("API returned unexpected format:", result);
        setError("ไม่สามารถโหลดข้อมูลบทเรียนได้: รูปแบบข้อมูลไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลบทเรียน: " + err.message);
    } finally {
      setLoading(false);
    }
  };
// โหลดข้อมูล AR Links
const fetchArLinks = async () => {
  setArLinksLoading(true);
  setArLinksError(null);
  
  try {
    const response = await fetch(AR_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log("Raw response from API:", await response.clone().text());
    
    const result = await response.json();
    console.log("AR Links API result:", result);
    
    // ตรวจสอบรูปแบบข้อมูลและแปลงให้อยู่ในรูปแบบที่ใช้งานได้
    let processedLinks = [];
    
    if (Array.isArray(result)) {
      // กรณี API ส่งเป็นอาร์เรย์โดยตรง
      processedLinks = result.map(item => ({
        id: item.id,
        title: item.link_name || item.title || 'ไม่มีชื่อ',
        ar_link: item.url || item.ar_link || ''
      }));
    } else if (result && typeof result === 'object') {
      // กรณี API ส่งเป็นออบเจ็กต์
      if (result.status === 'success' && Array.isArray(result.data)) {
        // รูปแบบ { status: 'success', data: [...] }
        processedLinks = result.data.map(item => ({
          id: item.id,
          title: item.link_name || item.title || 'ไม่มีชื่อ',
          ar_link: item.url || item.ar_link || ''
        }));
      } else if (Object.values(result).some(v => typeof v === 'object')) {
        // รูปแบบ { '0': {...}, '1': {...} }
        processedLinks = Object.values(result)
          .filter(v => typeof v === 'object' && v !== null)
          .map(item => ({
            id: item.id,
            title: item.link_name || item.title || 'ไม่มีชื่อ',
            ar_link: item.url || item.ar_link || ''
          }));
      }
    }
    
    console.log("Processed AR Links:", processedLinks);
    
    if (processedLinks.length > 0) {
      setArLinks(processedLinks);
    } else {
      setArLinksError("ไม่พบข้อมูลลิงก์ AR ในรูปแบบที่ถูกต้อง");
    }
  } catch (err) {
    console.error("Error fetching AR links:", err);
    setArLinksError("เกิดข้อผิดพลาดในการโหลดข้อมูลลิงก์ AR: " + err.message);
  } finally {
    setArLinksLoading(false);
  }
};
  // โหลดข้อมูลบทเรียนเมื่อโหลดคอมโพเนนต์
  useEffect(() => {
    fetchLessons();
    fetchArLinks(); // โหลดข้อมูล AR Links เมื่อโหลดคอมโพเนนต์
  }, []);

  // สร้างฟังก์ชันแยกสำหรับการกรองบทเรียน
  const filterLessons = (lessonsToFilter, term) => {
    // กรองบทเรียนตามสิทธิ์การเข้าถึง
    let accessibleLessons = lessonsToFilter;
    
    // ถ้าไม่ใช่ admin ให้แสดงเฉพาะบทเรียนที่สร้างโดยผู้ใช้ปัจจุบัน
    if (currentUser && currentUser.email !== ADMIN_EMAIL) {
      accessibleLessons = lessonsToFilter.filter(lesson => 
        lesson.createdBy === currentUser.email || lesson.createdBy === ''
      );
    }
    
    // กรองตามคำค้นหา
    if (!term || term.trim() === '') {
      setFilteredLessons(accessibleLessons);
    } else {
      const normalizedTerm = term.toLowerCase().trim();
      const filtered = accessibleLessons.filter(lesson => 
        lesson && lesson.title && 
        lesson.title.toLowerCase().includes(normalizedTerm)
      );
      console.log(`Filtering with term "${normalizedTerm}":`, filtered);
      setFilteredLessons(filtered);
    }
  };

  // คำค้นหาเปลี่ยน ให้อัปเดต filteredLessons
  useEffect(() => {
    console.log("Search term changed to:", searchTerm);
    filterLessons(lessons, searchTerm);
  }, [searchTerm, lessons, currentUser]);

  // ฟังก์ชันค้นหาบทเรียน
  const handleSearch = (e) => {
    const term = e.target.value;
    console.log("Search input value:", term);
    setSearchTerm(term);
  };

  // เลือกลิงก์ AR จากรายการ
  const handleSelectArLink = (arLink) => {
    if (isAddingLesson) {
      setNewLesson({...newLesson, arLink: arLink.ar_link});
    } else if (editingLesson) {
      setEditingLesson({...editingLesson, arLink: arLink.ar_link});
    }
    setShowArLinksList(false);
  };

  // เพิ่มบทเรียนใหม่
  const handleAddLesson = async () => {
    // ตรวจสอบว่ามีการตั้งค่า createdBy หรือไม่
    if (!newLesson.createdBy && currentUser) {
      setNewLesson({...newLesson, createdBy: currentUser.email});
    }

    try {
      setSyncStatus({ type: 'info', message: 'กำลังบันทึกข้อมูล...' });
      
      const response = await fetch(`${API_URL}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLesson,
          questions: [], // เริ่มต้นยังไม่มีคำถาม
          preLessonQuiz: [] // เริ่มต้นยังไม่มีแบบทดสอบก่อนเรียน
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // ตรวจสอบว่าข้อมูลที่ได้รับกลับมามี createdBy หรือไม่
        // ถ้าไม่มี ให้เพิ่ม createdBy เป็นผู้ใช้ปัจจุบัน
        const newLessonData = {
          ...result.data,
          createdBy: result.data.createdBy || currentUser.email,
          preLessonQuiz: result.data.preLessonQuiz || [] // เพิ่มแบบทดสอบก่อนเรียน
        };
        
        // อัปเดตรายการบทเรียนในหน้าจอและอัปเดต filteredLessons ด้วย
        const updatedLessons = [...lessons, newLessonData];
        setLessons(updatedLessons);
        
        // อัปเดต filteredLessons ด้วยฟังก์ชัน filterLessons
        filterLessons(updatedLessons, searchTerm);
        
        setSyncStatus({ type: 'success', message: 'บันทึกบทเรียนสำเร็จ' });
        
        // รีเซ็ตฟอร์ม
        setIsAddingLesson(false);
        setNewLesson({
          title: '',
          description: '',
          arLink: '',
          content: '',
          createdBy: currentUser ? currentUser.email : '',
          preLessonQuiz: []
        });
        
        // เลือกบทเรียนที่เพิ่งสร้างเพื่อแก้ไข
        setEditingLesson(newLessonData);
        setActiveTab('editQuestions');
      } else {
        setSyncStatus({ type: 'error', message: 'ไม่สามารถบันทึกบทเรียน' });
      }
    } catch (err) {
      console.error("Error adding lesson:", err);
      setSyncStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกบทเรียน' });
    } finally {
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  // แก้ไขบทเรียน
  const handleUpdateLesson = async () => {
    // ตรวจสอบสิทธิ์ก่อนทำการแก้ไขบทเรียน
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    try {
      setSyncStatus({ type: 'info', message: 'กำลังอัปเดตข้อมูล...' });
      
      // สร้างสำเนาข้อมูล editingLesson เพื่อหลีกเลี่ยงปัญหาการอ้างอิง
      const lessonToUpdate = {...editingLesson};
      
      // ตรวจสอบให้แน่ใจว่ามีอาร์เรย์คำถามอยู่
      if (!lessonToUpdate.questions) {
        lessonToUpdate.questions = [];
      }
      
      // ตรวจสอบให้แน่ใจว่ามีอาร์เรย์แบบทดสอบก่อนเรียนอยู่
      if (!lessonToUpdate.preLessonQuiz) {
        lessonToUpdate.preLessonQuiz = [];
      }
      
      // ตรวจสอบว่ามี createdBy หรือไม่ ถ้าไม่มีให้เพิ่ม
      if (!lessonToUpdate.createdBy && currentUser) {
        lessonToUpdate.createdBy = currentUser.email;
      }
      
      const response = await fetch(`${API_URL}/lessons/${lessonToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonToUpdate),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // ตรวจสอบว่าข้อมูลที่ได้รับกลับมามี createdBy หรือไม่
        const updatedLessonData = {
          ...result.data,
          createdBy: result.data.createdBy || lessonToUpdate.createdBy || currentUser.email,
          preLessonQuiz: result.data.preLessonQuiz || lessonToUpdate.preLessonQuiz || []
        };
        
        // อัปเดตรายการบทเรียนในหน้าจอ
        const updatedLessons = lessons.map(lesson => 
          lesson.id === lessonToUpdate.id ? updatedLessonData : lesson
        );
        setLessons(updatedLessons);
        
        // อัปเดต filteredLessons ด้วยฟังก์ชัน filterLessons
        filterLessons(updatedLessons, searchTerm);
        
        setSyncStatus({ type: 'success', message: 'อัปเดตบทเรียนสำเร็จ' });
        
        setEditingLesson(null);
        setActiveTab('lessons');
      } else {
        setSyncStatus({ type: 'error', message: 'ไม่สามารถอัปเดตบทเรียน' });
      }
    } catch (err) {
      console.error("Error updating lesson:", err);
      setSyncStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการอัปเดตบทเรียน' });
    } finally {
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  // ลบบทเรียน
  const handleDeleteLesson = async (id) => {
    // หาข้อมูลบทเรียนที่จะลบ
    const lessonToDelete = lessons.find(lesson => lesson.id === id);
    
    // ตรวจสอบสิทธิ์ก่อนทำการลบบทเรียน
    if (!canManageLesson(lessonToDelete)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการลบบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนนี้?')) {
      try {
        setSyncStatus({ type: 'info', message: 'กำลังลบข้อมูล...' });
        
        const response = await fetch(`${API_URL}/lessons/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          // อัปเดตรายการบทเรียนในหน้าจอ
          const updatedLessons = lessons.filter(lesson => lesson.id !== id);
          setLessons(updatedLessons);
          
          // อัปเดต filteredLessons ด้วยฟังก์ชัน filterLessons
          filterLessons(updatedLessons, searchTerm);
          
          setSyncStatus({ type: 'success', message: 'ลบบทเรียนสำเร็จ' });
        } else {
          setSyncStatus({ type: 'error', message: 'ไม่สามารถลบบทเรียน' });
        }
      } catch (err) {
        console.error("Error deleting lesson:", err);
        setSyncStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการลบบทเรียน' });
      } finally {
        setTimeout(() => setSyncStatus(null), 3000);
      }
    }
  };

  // เลือกบทเรียนเพื่อแก้ไข
  const handleEditLesson = (lesson) => {
    // ตรวจสอบสิทธิ์ก่อนทำการแก้ไขบทเรียน
    if (!canManageLesson(lesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    setEditingLesson({
      ...lesson,
      title: lesson.title || '',
      description: lesson.description || '',
      arLink: lesson.arLink || '',
      content: lesson.content || '',
      questions: lesson.questions || [],
      preLessonQuiz: lesson.preLessonQuiz || [], // เพิ่มค่าเริ่มต้นถ้าไม่มีข้อมูล
      createdBy: lesson.createdBy || (currentUser ? currentUser.email : '')
    });
    setActiveTab('editLesson');
  };

  // ทำเช่นเดียวกันสำหรับ handleEditQuestions
  const handleEditQuestions = (lesson) => {
    // ตรวจสอบสิทธิ์ก่อนทำการแก้ไขคำถาม
    if (!canManageLesson(lesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการจัดการคำถามสำหรับบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    setEditingLesson({
      ...lesson,
      title: lesson.title || '',
      description: lesson.description || '',
      arLink: lesson.arLink || '',
      content: lesson.content || '',
      questions: lesson.questions || [],
      preLessonQuiz: lesson.preLessonQuiz || [], // เพิ่มค่าเริ่มต้นถ้าไม่มีข้อมูล
      createdBy: lesson.createdBy || (currentUser ? currentUser.email : '')
    });
    setActiveTab('editQuestions');
  };

  // เพิ่มฟังก์ชันสำหรับแก้ไขแบบทดสอบก่อนเรียน
  const handleEditPreLessonQuiz = (lesson) => {
    // ตรวจสอบสิทธิ์ก่อนทำการแก้ไขแบบทดสอบก่อนเรียน
    if (!canManageLesson(lesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการจัดการแบบทดสอบก่อนเรียนของบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    setEditingLesson({
      ...lesson,
      title: lesson.title || '',
      description: lesson.description || '',
      arLink: lesson.arLink || '',
      content: lesson.content || '',
      questions: lesson.questions || [],
      preLessonQuiz: lesson.preLessonQuiz || [], // เพิ่มค่าเริ่มต้นถ้าไม่มีข้อมูล
      createdBy: lesson.createdBy || (currentUser ? currentUser.email : '')
    });
    setActiveTab('editPreLessonQuiz');
  };

  // เพิ่มคำถามใหม่
  const handleAddQuestion = () => {
    // ตรวจสอบสิทธิ์ก่อนทำการเพิ่มคำถาม
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการเพิ่มคำถามสำหรับบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    const newQuestion = {
      questionText: 'คำถามใหม่',
      answerOptions: [
        { answerText: 'ตัวเลือก 1', isCorrect: false },
        { answerText: 'ตัวเลือก 2', isCorrect: true },
        { answerText: 'ตัวเลือก 3', isCorrect: false },
        { answerText: 'ตัวเลือก 4', isCorrect: false },
      ],
    };
    
    const updatedQuestions = [...(editingLesson.questions || []), newQuestion];
    setEditingLesson({...editingLesson, questions: updatedQuestions});
  };

  // อัปเดตคำถามของแบบทดสอบก่อนเรียน
  const handleUpdatePreLessonQuestion = (index, field, value) => {
    // ตรวจสอบสิทธิ์ก่อนทำการอัปเดตคำถาม
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขคำถามสำหรับแบบทดสอบก่อนเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    const updatedQuestions = [...editingLesson.preLessonQuiz];
    updatedQuestions[index] = {...updatedQuestions[index], [field]: value};
    setEditingLesson({...editingLesson, preLessonQuiz: updatedQuestions});
  };

  // อัปเดตตัวเลือกคำตอบของแบบทดสอบก่อนเรียน
  const handleUpdatePreLessonAnswerOption = (questionIndex, optionIndex, field, value) => {
    // ตรวจสอบสิทธิ์ก่อนทำการอัปเดตตัวเลือกคำตอบ
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขตัวเลือกคำตอบสำหรับแบบทดสอบก่อนเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    const updatedQuestions = [...editingLesson.preLessonQuiz];
    const updatedOptions = [...updatedQuestions[questionIndex].answerOptions];
    
    if (field === 'isCorrect') {
      // หากเป็นการอัปเดตว่าข้อไหนถูก ให้กำหนดข้ออื่นเป็นผิดทั้งหมด
      updatedOptions.forEach((option, idx) => {
        updatedOptions[idx] = {...option, isCorrect: idx === optionIndex};
      });
    } else {
      updatedOptions[optionIndex] = {...updatedOptions[optionIndex], [field]: value};
    }
    
    updatedQuestions[questionIndex] = {...updatedQuestions[questionIndex], answerOptions: updatedOptions};
    setEditingLesson({...editingLesson, preLessonQuiz: updatedQuestions});
  };

  // เพิ่มคำถามใหม่สำหรับแบบทดสอบก่อนเรียน
  const handleAddPreLessonQuestion = () => {
    // ตรวจสอบสิทธิ์ก่อนทำการเพิ่มคำถาม
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการเพิ่มคำถามสำหรับแบบทดสอบก่อนเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    const newQuestion = {
      questionText: 'คำถามใหม่สำหรับแบบทดสอบก่อนเรียน',
      answerOptions: [
        { answerText: 'ตัวเลือก 1', isCorrect: false },
        { answerText: 'ตัวเลือก 2', isCorrect: true },
        { answerText: 'ตัวเลือก 3', isCorrect: false },
        { answerText: 'ตัวเลือก 4', isCorrect: false },
      ],
    };
    
    const updatedPreLessonQuiz = [...(editingLesson.preLessonQuiz || []), newQuestion];
    setEditingLesson({...editingLesson, preLessonQuiz: updatedPreLessonQuiz});
  };

// อัปเดตคำถาม
const handleUpdateQuestion = (index, field, value) => {
  // ตรวจสอบสิทธิ์ก่อนทำการอัปเดตคำถาม
  if (!canManageLesson(editingLesson)) {
    setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขคำถามสำหรับบทเรียนนี้' });
    setTimeout(() => setSyncStatus(null), 3000);
    return;
  }

  const updatedQuestions = [...editingLesson.questions];
  updatedQuestions[index] = {...updatedQuestions[index], [field]: value};
  setEditingLesson({...editingLesson, questions: updatedQuestions});
};

// อัปเดตตัวเลือกคำตอบ
const handleUpdateAnswerOption = (questionIndex, optionIndex, field, value) => {
  // ตรวจสอบสิทธิ์ก่อนทำการอัปเดตตัวเลือกคำตอบ
  if (!canManageLesson(editingLesson)) {
    setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการแก้ไขตัวเลือกคำตอบสำหรับบทเรียนนี้' });
    setTimeout(() => setSyncStatus(null), 3000);
    return;
  }

  const updatedQuestions = [...editingLesson.questions];
  const updatedOptions = [...updatedQuestions[questionIndex].answerOptions];
  
  if (field === 'isCorrect') {
    // หากเป็นการอัปเดตว่าข้อไหนถูก ให้กำหนดข้ออื่นเป็นผิดทั้งหมด
    updatedOptions.forEach((option, idx) => {
      updatedOptions[idx] = {...option, isCorrect: idx === optionIndex};
    });
  } else {
    updatedOptions[optionIndex] = {...updatedOptions[optionIndex], [field]: value};
  }
  
  updatedQuestions[questionIndex] = {...updatedQuestions[questionIndex], answerOptions: updatedOptions};
  setEditingLesson({...editingLesson, questions: updatedQuestions});
};

  // ลบคำถาม
  const handleDeleteQuestion = (index) => {
    // ตรวจสอบสิทธิ์ก่อนทำการลบคำถาม
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการลบคำถามสำหรับบทเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?')) {
      const updatedQuestions = [...editingLesson.questions];
      updatedQuestions.splice(index, 1);
      setEditingLesson({...editingLesson, questions: updatedQuestions});
    }
  };
  
  // ลบคำถามของแบบทดสอบก่อนเรียน
  const handleDeletePreLessonQuestion = (index) => {
    // ตรวจสอบสิทธิ์ก่อนทำการลบคำถาม
    if (!canManageLesson(editingLesson)) {
      setSyncStatus({ type: 'error', message: 'คุณไม่มีสิทธิ์ในการลบคำถามสำหรับแบบทดสอบก่อนเรียนนี้' });
      setTimeout(() => setSyncStatus(null), 3000);
      return;
    }

    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?')) {
      const updatedPreLessonQuiz = [...editingLesson.preLessonQuiz];
      updatedPreLessonQuiz.splice(index, 1);
      setEditingLesson({...editingLesson, preLessonQuiz: updatedPreLessonQuiz});
    }
  };

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear();
      navigate("/auth");
    }
  };

  // Toggle Sidebar
  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  // การแสดงผลส่วนรายการบทเรียน
  const renderLessonsList = () => (
    <div className="lesson-list">
      <h2>รายการบทเรียน</h2>

      <div className="action-buttons">
        <div className="action-buttons-left">
          <button className="add-new-button" onClick={() => setIsAddingLesson(true)}>
            <i className="fa fa-plus-circle"></i> เพิ่มบทเรียนใหม่
          </button>
        </div>
        
        <div className="action-buttons-right">
          <div className="search-container" onClick={(e) => {
            // Focus ไปที่ input เมื่อคลิกที่ container
            const input = e.currentTarget.querySelector('.search-input');
            if (input) input.focus();
          }}>
            <span className="search-icon">
              <i className="fa fa-search"></i>
            </span>
            <input
              type="text"
              placeholder="ค้นหาบทเรียนตามชื่อ..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-button"
                onClick={(e) => {
                  e.stopPropagation(); // ป้องกันการส่งต่อ event
                  setSearchTerm('');
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* แสดงจำนวนผลลัพธ์การค้นหา */}
      {!loading && searchTerm && (
        <div className="search-results-count">
          พบ {filteredLessons.length} บทเรียนที่ตรงกับคำค้นหา "{searchTerm}"
        </div>
      )}
      
      {syncStatus && (
        <div className={`sync-status ${syncStatus.type}`}>
          {syncStatus.type === 'info' && <i className="fa fa-info-circle"></i>}
          {syncStatus.type === 'success' && <i className="fa fa-check-circle"></i>}
          {syncStatus.type === 'error' && <i className="fa fa-exclamation-circle"></i>}
          {syncStatus.message}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fa fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchLessons}>ลองอีกครั้ง</button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fa fa-book"></i>
          </div>
          <h3 className="empty-state-title">
            {searchTerm ? `ไม่พบบทเรียนที่ตรงกับคำค้นหา` : "ยังไม่มีบทเรียน"}
          </h3>
          <p className="empty-state-text">
            {searchTerm ? `ไม่พบบทเรียนที่ตรงกับคำค้นหา "${searchTerm}"` : "กรุณาเพิ่มบทเรียนใหม่เพื่อเริ่มใช้งาน"}
          </p>
          {searchTerm && (
            <button 
              className="btn btn-secondary"
              onClick={() => setSearchTerm('')}
            >
              <i className="fa fa-times"></i> ล้างการค้นหา
            </button>
          )}
        </div>
      ) : (
        <div className="lesson-cards">
          {filteredLessons.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <p>จำนวนคำถาม: {lesson.questions ? lesson.questions.length : 0} ข้อ</p>
              <p>แบบทดสอบก่อนเรียน: {lesson.preLessonQuiz ? lesson.preLessonQuiz.length : 0} ข้อ</p>
              {lesson.createdBy && (
                <p className="lesson-creator">
                  <i className="fa fa-user"></i>
                  <small>สร้างโดย: {lesson.createdBy === currentUser?.email ? 'คุณ' : lesson.createdBy}</small>
                </p>
              )}
              <div className="button-group">
                <button 
                  onClick={() => handleEditLesson(lesson)} 
                  disabled={!canManageLesson(lesson)}
                  className={!canManageLesson(lesson) ? "button-disabled" : "edit-button"}
                >
                  <i className="fa fa-edit"></i> แก้ไขบทเรียน
                </button>
                <button 
                  onClick={() => handleEditQuestions(lesson)} 
                  disabled={!canManageLesson(lesson)}
                  className={!canManageLesson(lesson) ? "button-disabled" : "manage-button"}
                >
                  <i className="fa fa-question-circle"></i> จัดการคำถาม
                </button>
                <button 
                  onClick={() => handleEditPreLessonQuiz(lesson)} 
                  disabled={!canManageLesson(lesson)}
                  className={!canManageLesson(lesson) ? "button-disabled" : ""}
                >
                  <i className="fa fa-list-alt"></i> แบบทดสอบก่อนเรียน
                </button>
                <button 
                  onClick={() => handleDeleteLesson(lesson.id)}
                  disabled={!canManageLesson(lesson)}
                  className={`delete-button ${!canManageLesson(lesson) ? "button-disabled" : ""}`}
                >
                  <i className="fa fa-trash"></i> ลบบทเรียน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isAddingLesson && (
        <div className="modal-overlay">
          <div className="modal add-lesson-modal">
            <div className="modal-header">
              <h2><i className="fa fa-plus-circle"></i> เพิ่มบทเรียนใหม่</h2>
              <button className="close-modal-btn" onClick={() => setIsAddingLesson(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group required">
                <label><i className="fa fa-book"></i> ชื่อบทเรียน:</label>
                <input 
                  type="text" 
                  value={newLesson.title} 
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="ระบุชื่อบทเรียน..."
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label><i className="fa fa-info-circle"></i> คำอธิบาย:</label>
                <input 
                  type="text" 
                  value={newLesson.description} 
                  onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="อธิบายเกี่ยวกับบทเรียนนี้..."
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label><i className="fa fa-link"></i> ลิงก์ AR:</label>
                <div className="ar-link-container">
                  <input 
                    type="text" 
                    value={newLesson.arLink} 
                    onChange={(e) => setNewLesson({...newLesson, arLink: e.target.value})}
                    onClick={() => setShowArLinksList(true)}
                    placeholder="คลิกเพื่อเลือกหรือพิมพ์ลิงก์ AR..."
                    className="form-control"
                  />
                  {showArLinksList && (
                    <div className="ar-links-dropdown">
                      {arLinksLoading ? (
                        <div className="ar-links-loading">กำลังโหลดลิงก์ AR...</div>
                      ) : arLinksError ? (
                        <div className="ar-links-error">{arLinksError}</div>
                      ) : arLinks.length === 0 ? (
                        <div className="ar-links-empty">ไม่พบลิงก์ AR</div>
                      ) : (
                        <ul>
                          {arLinks.map((link, index) => (
                            <li key={index} onClick={() => handleSelectArLink(link)}>
                              <div className="ar-link-item">
                                <span className="ar-link-title">{link.title}</span>
                                <span className="ar-link-url">{link.ar_link}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button className="close-dropdown" onClick={() => setShowArLinksList(false)}>
                        ปิด
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label><i className="fa fa-file-text"></i> เนื้อหา:</label>
                <textarea 
                  value={newLesson.content} 
                  onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                  placeholder="เพิ่มเนื้อหาบทเรียน..."
                  className="form-control"
                  rows="15"
                />
              </div>
              <div className="form-group">
                <label><i className="fa fa-check-square"></i> แบบทดสอบก่อนเรียน:</label>
                <p className="help-text">แบบทดสอบก่อนเรียนจะถูกเพิ่มหลังจากสร้างบทเรียน</p>
              </div>
              <div className="form-group teacher-info">
                <div className="teacher-info-header">
                  <div className="teacher-avatar">
                    {currentUser?.email?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <span className="teacher-name">
                    {currentUser?.email || 'ผู้สอน'}
                  </span>
                </div>
                <small>บทเรียนนี้จะถูกสร้างในชื่อบัญชีของคุณ</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={handleAddLesson}>
                <i className="fa fa-save"></i> บันทึกบทเรียน
              </button>
              <button className="btn btn-danger" onClick={() => setIsAddingLesson(false)}>
                <i className="fa fa-times"></i> ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // การแสดงผลส่วนแก้ไขบทเรียน
  const renderEditLesson = () => (
    <div className="modal-overlay">
      <div className="modal edit-lesson-modal">
        <div className="modal-header">
          <h2><i className="fa fa-edit"></i> แก้ไขบทเรียน</h2>
          <button className="close-modal-btn" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="modal-content">
          {!canManageLesson(editingLesson) ? (
            <div className="auth-warning">
              <i className="fa fa-exclamation-triangle"></i>
              <p>คุณไม่มีสิทธิ์ในการแก้ไขบทเรียนนี้</p>
            </div>
          ) : (
            <>
              <div className="form-group required">
                <label><i className="fa fa-book"></i> ชื่อบทเรียน:</label>
                <input 
                  type="text" 
                  value={editingLesson.title} 
                  onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label><i className="fa fa-info-circle"></i> คำอธิบาย:</label>
                <input 
                  type="text" 
                  value={editingLesson.description} 
                  onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label><i className="fa fa-link"></i> ลิงก์ AR:</label>
                <div className="ar-link-container">
                  <input 
                    type="text" 
                    value={editingLesson.arLink} 
                    onChange={(e) => setEditingLesson({...editingLesson, arLink: e.target.value})}
                    onClick={() => setShowArLinksList(true)}
                    placeholder="คลิกเพื่อเลือกหรือพิมพ์ลิงก์ AR..."
                    className="form-control"
                  />
                  {showArLinksList && (
                    <div className="ar-links-dropdown">
                      {arLinksLoading ? (
                        <div className="ar-links-loading">กำลังโหลดลิงก์ AR...</div>
                      ) : arLinksError ? (
                        <div className="ar-links-error">{arLinksError}</div>
                      ) : arLinks.length === 0 ? (
                        <div className="ar-links-empty">ไม่พบลิงก์ AR</div>
                      ) : (
                        <ul>
                          {arLinks.map((link, index) => (
                            <li key={index} onClick={() => handleSelectArLink(link)}>
                              <div className="ar-link-item">
                                <span className="ar-link-title">{link.title}</span>
                                <span className="ar-link-url">{link.ar_link}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button className="close-dropdown" onClick={() => setShowArLinksList(false)}>
                        ปิด
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label><i className="fa fa-file-text"></i> เนื้อหา:</label>
                <textarea 
                  value={editingLesson.content} 
                  onChange={(e) => setEditingLesson({...editingLesson, content: e.target.value})}
                  className="form-control"
                  rows="18"
                />
              </div>
              <div className="form-group teacher-info">
                <div className="teacher-info-header">
                  <div className="teacher-avatar">
                    {currentUser?.email?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <span className="teacher-name">
                    {editingLesson.createdBy === currentUser?.email ? (
                      <small>บทเรียนนี้สร้างโดยคุณ</small>
                    ) : editingLesson.createdBy === ADMIN_EMAIL ? (
                      <small>บทเรียนนี้สร้างโดยผู้ดูแลระบบ</small>
                    ) : (
                      <small>บทเรียนนี้สร้างโดยครูท่านอื่น</small>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {canManageLesson(editingLesson) && (
            <>
              <button className="btn btn-success" onClick={handleUpdateLesson}>
                <i className="fa fa-save"></i> บันทึกการเปลี่ยนแปลง
              </button>
              <button className="btn btn-info" onClick={() => setActiveTab('editQuestions')}>
                <i className="fa fa-question-circle"></i> จัดการคำถาม
              </button>
              <button className="btn btn-warning" onClick={() => setActiveTab('editPreLessonQuiz')}>
                <i className="fa fa-list-alt"></i> แบบทดสอบก่อนเรียน
              </button>
            </>
          )}
          <button className="btn btn-danger" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i> ปิด
          </button>
        </div>
      </div>
    </div>
  );

  // การแสดงผลส่วนแก้ไขคำถาม
  const renderEditQuestions = () => (
    <div className="modal-overlay">
      <div className="modal edit-questions-modal">
        <div className="modal-header">
          <h2>
            <i className="fa fa-question-circle"></i> 
            จัดการคำถามสำหรับบทเรียน: {editingLesson.title}
            <span className="question-count-badge">
              {editingLesson.questions ? editingLesson.questions.length : 0} คำถาม
            </span>
          </h2>
          <button className="close-modal-btn" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="modal-content">
          {!canManageLesson(editingLesson) ? (
            <div className="auth-warning">
              <i className="fa fa-exclamation-triangle"></i>
              <p>คุณไม่มีสิทธิ์ในการจัดการคำถามสำหรับบทเรียนนี้</p>
            </div>
          ) : (
            <>
              {editingLesson.questions && editingLesson.questions.length > 0 ? (
                editingLesson.questions.map((question, questionIndex) => (
                  <>
                    {questionIndex > 0 && (
                      <div className="question-divider">
                        <span className="question-divider-text">คำถามที่ {questionIndex + 1}</span>
                      </div>
                    )}
                    <div key={questionIndex} className="question-card">
                      <div className="question-header">
                        <h4>คำถามที่ {questionIndex + 1}</h4>
                        <button className="delete-question-btn" onClick={() => handleDeleteQuestion(questionIndex)}>
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                      <div className="form-group">
                        <label><i className="fa fa-question"></i> คำถาม:</label>
                        <textarea 
                          value={question.questionText} 
                          onChange={(e) => handleUpdateQuestion(questionIndex, 'questionText', e.target.value)}
                          className="form-control question-text-input"
                          placeholder="กรอกข้อความคำถาม..."
                          rows="4"
                        ></textarea>
                      </div>
                      
                      <h4><i className="fa fa-list-ul"></i> ตัวเลือกคำตอบ</h4>
                      {question.answerOptions.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className={`option-row ${option.isCorrect ? 'correct-answer' : ''}`}
                        >
                          <span className="option-number">{optionIndex + 1}</span>
                          <input 
                            type="text" 
                            value={option.answerText} 
                            onChange={(e) => handleUpdateAnswerOption(questionIndex, optionIndex, 'answerText', e.target.value)}
                            className="form-control"
                            placeholder={`ตัวเลือกที่ ${optionIndex + 1}`}
                          />
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name={`correct-${questionIndex}`} 
                              checked={option.isCorrect} 
                              onChange={() => handleUpdateAnswerOption(questionIndex, optionIndex, 'isCorrect', true)}
                            />
                            <span>เป็นคำตอบที่ถูกต้อง</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                ))
              ) : (
                <div className="empty-questions">
                  <div className="empty-state-icon">
                    <i className="fa fa-question-circle"></i>
                  </div>
                  <h3 className="empty-state-title">ยังไม่มีคำถามในบทเรียนนี้</h3>
                  <p className="empty-state-text">คลิกปุ่ม "เพิ่มคำถามใหม่" เพื่อเริ่มสร้างคำถามสำหรับบทเรียนนี้</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          {canManageLesson(editingLesson) && (
            <>
              <button className="btn btn-primary" onClick={handleAddQuestion}>
                <i className="fa fa-plus-circle"></i> เพิ่มคำถามใหม่
              </button>
              <button className="btn btn-success" onClick={handleUpdateLesson}>
                <i className="fa fa-save"></i> บันทึกการเปลี่ยนแปลง
              </button>
              <button className="btn btn-warning" onClick={() => setActiveTab('editLesson')}>
                <i className="fa fa-edit"></i> แก้ไขบทเรียน
              </button>
            </>
          )}
          <button className="btn btn-danger" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i> ปิด
          </button>
        </div>
      </div>
    </div>
  );

  // การแสดงผลส่วนแก้ไขแบบทดสอบก่อนเรียน
  const renderEditPreLessonQuiz = () => (
    <div className="modal-overlay">
      <div className="modal edit-pre-quiz-modal">
        <div className="modal-header">
          <h2>
            <i className="fa fa-list-alt"></i> 
            แบบทดสอบก่อนเรียน: {editingLesson.title}
            <span className="question-count-badge">
              {editingLesson.preLessonQuiz ? editingLesson.preLessonQuiz.length : 0} คำถาม
            </span>
          </h2>
          <button className="close-modal-btn" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="modal-content">
          {!canManageLesson(editingLesson) ? (
            <div className="auth-warning">
              <i className="fa fa-exclamation-triangle"></i>
              <p>คุณไม่มีสิทธิ์ในการจัดการแบบทดสอบก่อนเรียนสำหรับบทเรียนนี้</p>
            </div>
          ) : (
            <>
              <div className="quiz-info-box">
                <i className="fa fa-info-circle"></i>
                <div>
                  <h4>แบบทดสอบก่อนเรียน</h4>
                  <p>นักเรียนจะต้องทำแบบทดสอบนี้ก่อนเข้าสู่บทเรียน เพื่อวัดความรู้พื้นฐานของนักเรียนก่อนเรียน</p>
                </div>
              </div>

              {editingLesson.preLessonQuiz && editingLesson.preLessonQuiz.length > 0 ? (
                editingLesson.preLessonQuiz.map((question, questionIndex) => (
                  <>
                    {questionIndex > 0 && (
                      <div className="question-divider">
                        <span className="question-divider-text">คำถามก่อนเรียนที่ {questionIndex + 1}</span>
                      </div>
                    )}
                    <div key={questionIndex} className="question-card">
                      <div className="question-header">
                        <h4>คำถามก่อนเรียนที่ {questionIndex + 1}</h4>
                        <button className="delete-question-btn" onClick={() => handleDeletePreLessonQuestion(questionIndex)}>
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                      <div className="form-group">
                        <label><i className="fa fa-question"></i> คำถาม:</label>
                        <textarea 
                          value={question.questionText} 
                          onChange={(e) => handleUpdatePreLessonQuestion(questionIndex, 'questionText', e.target.value)}
                          className="form-control question-text-input"
                          placeholder="กรอกข้อความคำถามก่อนเรียน..."
                          rows="4"
                        ></textarea>
                      </div>
                      
                      <h4><i className="fa fa-list-ul"></i> ตัวเลือกคำตอบ</h4>
                      {question.answerOptions.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className={`option-row ${option.isCorrect ? 'correct-answer' : ''}`}
                        >
                          <span className="option-number">{optionIndex + 1}</span>
                          <input 
                            type="text" 
                            value={option.answerText} 
                            onChange={(e) => handleUpdatePreLessonAnswerOption(questionIndex, optionIndex, 'answerText', e.target.value)}
                            className="form-control"
                            placeholder={`ตัวเลือกที่ ${optionIndex + 1}`}
                          />
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name={`correct-pre-${questionIndex}`} 
                              checked={option.isCorrect} 
                              onChange={() => handleUpdatePreLessonAnswerOption(questionIndex, optionIndex, 'isCorrect', true)}
                            />
                            <span>เป็นคำตอบที่ถูกต้อง</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                ))
              ) : (
                <div className="empty-questions">
                  <div className="empty-state-icon">
                    <i className="fa fa-clipboard-check"></i>
                  </div>
                  <h3 className="empty-state-title">ยังไม่มีคำถามในแบบทดสอบก่อนเรียน</h3>
                  <p className="empty-state-text">คลิกปุ่ม "เพิ่มคำถามใหม่" ด้านล่างเพื่อเริ่มสร้างคำถามสำหรับแบบทดสอบก่อนเรียน</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          {canManageLesson(editingLesson) && (
            <>
              <button className="btn btn-primary" onClick={handleAddPreLessonQuestion}>
                <i className="fa fa-plus-circle"></i> เพิ่มคำถามใหม่
              </button>
              <button className="btn btn-success" onClick={handleUpdateLesson}>
                <i className="fa fa-save"></i> บันทึกการเปลี่ยนแปลง
              </button>
              <button className="btn btn-warning" onClick={() => setActiveTab('editLesson')}>
                <i className="fa fa-edit"></i> กลับไปแก้ไขบทเรียน
              </button>
            </>
          )}
          <button className="btn btn-danger" onClick={() => {
            setEditingLesson(null);
            setActiveTab('lessons');
          }}>
            <i className="fa fa-times"></i> ปิด
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <TeacherLayout title="จัดการบทเรียนและแบบทดสอบ">
      <div className="lesson-manager">
        {currentUser && currentUser.email === ADMIN_EMAIL && (
          <div className="admin-badge">ผู้ดูแลระบบ</div>
        )}
        {currentUser && currentUser.email !== ADMIN_EMAIL && (
          <div className="admin-badge teacher-badge">ครู</div>
        )}

        {/* แสดงรายการบทเรียน */}
        {renderLessonsList()}
        
        {/* แสดง Modal ตามการเลือกแท็บ */}
        {activeTab === 'editLesson' && editingLesson && renderEditLesson()}
        {activeTab === 'editQuestions' && editingLesson && renderEditQuestions()}
        {activeTab === 'editPreLessonQuiz' && editingLesson && renderEditPreLessonQuiz()}
      </div>
    </TeacherLayout>
  );
};

export default TeacherLessonManager;