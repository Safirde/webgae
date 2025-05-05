import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  doc,
  setDoc, 
  getDoc, 
  enableIndexedDbPersistence
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwjjn9NZV3Orhreuz_s46lBNsecuKTe0c",
  authDomain: "projectreal-79461.firebaseapp.com",
  projectId: "projectreal-79461",
  storageBucket: "projectreal-79461.appspot.com",
  messagingSenderId: "732077338931",
  appId: "1:732077338931:web:01f9d3d31c258709394e46",
  measurementId: "G-4Y8TFJFXJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ระบุอีเมลของครูที่มีสิทธิ์ในการจัดการข้อมูลนักเรียน
const AUTHORIZED_TEACHER_EMAIL = "niyakadee165@gmail.com";

// Enable offline persistence for Firestore
try {
  enableIndexedDbPersistence(db, { synchronizeTabs: true })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Cannot enable Firestore persistence: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence is not available in this browser');
      }
    });
} catch (error) {
  console.error("Error enabling persistence:", error);
}

// Create authentication context
const AuthContext = createContext(null);
export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'teacher' or 'student'
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [isAuthorizedTeacher, setIsAuthorizedTeacher] = useState(false); // เพิ่ม state สำหรับตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check and create user document in Firestore
  const checkAndCreateUserDoc = async (user) => {
    if (!user) return false;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
      const isAuthorized = user.email === AUTHORIZED_TEACHER_EMAIL;
      setIsAuthorizedTeacher(isAuthorized);
      
      if (!userDoc.exists()) {
        console.log("User document not found, creating new one");
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          userType: 'selectedUserType',
          createdAt: new Date(),
          isAuthorizedTeacher: isAuthorized // เพิ่มฟิลด์สำหรับระบุว่าเป็นครูที่มีสิทธิ์หรือไม่
        });
        console.log("Created new user document for:", user.email);
        return true;
      } else {
        // อัปเดตสถานะการเป็นครูที่มีสิทธิ์ในเอกสารที่มีอยู่แล้ว
        await setDoc(userDocRef, { isAuthorizedTeacher: isAuthorized }, { merge: true });
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating user:", error);
      return false;
    }
  };

  // Authentication state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      // ตรวจสอบว่าผู้ใช้กำลังพยายามเลือกประเภทผู้ใช้หรือไม่
      const isSelectingUserType = window.location.pathname.includes('/select-user-type');
      
      if (user && !isSelectingUserType) {
        // User is signed in with Firebase
        await checkAndCreateUserDoc(user);
        
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            setCurrentUser(user);
            setUserType(userDoc.data().userType || 'teacher');
            
            // ตรวจสอบและอัปเดตสถานะการเป็นครูที่มีสิทธิ์
            const isAuthorized = user.email === AUTHORIZED_TEACHER_EMAIL;
            setIsAuthorizedTeacher(isAuthorized);
          } else {
            await signOut(auth);
            setCurrentUser(null);
            setUserType(null);
            setIsAuthorizedTeacher(false);
          }
        } catch (error) {
          console.error("Error checking user status:", error);
        }
      } else if (isSelectingUserType) {
        // ถ้าอยู่ที่หน้าเลือกประเภทผู้ใช้ ไม่ต้องเปลี่ยนเส้นทาง
        setLoading(false);
        return;
      } else {
        // No Firebase user, check local storage for student login
        const storedToken = localStorage.getItem('authToken');
        const storedUserType = localStorage.getItem('userType');
        if (storedToken && storedUserType === 'student') {
          try {
            // แก้ไขการอ่านข้อมูลจาก localStorage โดยตรงแทนที่จะใช้ btoa/atob
            const studentUser = JSON.parse(storedToken);
            setCurrentUser(studentUser);
            setUserType('student');
            setIsAuthorizedTeacher(false); // นักเรียนไม่ใช่ครูที่มีสิทธิ์
          } catch (error) {
            console.error("Error parsing stored auth token:", error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            setCurrentUser(null);
            setUserType(null);
            setIsAuthorizedTeacher(false);
          }
        } else {
          setCurrentUser(null);
          setUserType(null);
          setIsAuthorizedTeacher(false);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [networkStatus]);

  // Teacher login with email/password
  const loginTeacher = async (email, password) => {
    console.log("Attempting to login teacher:", email);
    
    try {
      // Use session persistence for Firebase
      await setPersistence(auth, browserSessionPersistence);
      
      // Authenticate with Firebase
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Create user document if it doesn't exist
      await checkAndCreateUserDoc(result.user);
      
      // Get user type from Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      const isTeacher = userDoc.exists() && userDoc.data().userType === 'teacher';
      
      // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
      const isAuthorized = result.user.email === AUTHORIZED_TEACHER_EMAIL;
      setIsAuthorizedTeacher(isAuthorized);
      
      if (isTeacher) {
        localStorage.setItem("tempUserUid", result.user.uid);
        setUserType('teacher');
        return true;
      } else {
        console.log("User is not a teacher, logging out");
        await signOut(auth);
        setIsAuthorizedTeacher(false);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthorizedTeacher(false);
      return false;
    }
  };

  // Google sign-in for teachers
  const loginWithGoogle = async () => {
    console.log("Attempting to login with Google");
    
    if (!navigator.onLine) {
      console.error("Cannot login with Google while offline");
      return false;
    }
    
    try {
      await setPersistence(auth, browserSessionPersistence);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // ตรวจสอบว่าเป็นอีเมลที่มีสิทธิ์หรือไม่
      const isAuthorized = result.user.email === AUTHORIZED_TEACHER_EMAIL;
      setIsAuthorizedTeacher(isAuthorized);
      
      // Check if user document exists
      await checkAndCreateUserDoc(result.user);
      
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      // If user doesn't exist or is a teacher
      if (!userDoc.exists() || userDoc.data().userType === 'teacher') {
        // Create new teacher account if it doesn't exist
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", result.user.uid), {
            email: result.user.email,
            displayName: result.user.displayName,
            userType: 'teacher',
            createdAt: new Date(),
            isAuthorizedTeacher: isAuthorized // เพิ่มฟิลด์สำหรับระบุว่าเป็นครูที่มีสิทธิ์หรือไม่
          });
        } else {
          // อัปเดตสถานะการเป็นครูที่มีสิทธิ์ในเอกสารที่มีอยู่แล้ว
          await setDoc(doc(db, "users", result.user.uid), 
            { isAuthorizedTeacher: isAuthorized }, 
            { merge: true }
          );
        }
        
        setUserType('teacher');
        return true;
      } else {
        // Not a teacher
        await signOut(auth);
        setIsAuthorizedTeacher(false);
        return false;
      }
    } catch (error) {
      console.error("Error logging in with Google:", error);
      setIsAuthorizedTeacher(false);
      return false;
    }
  };

  // Register teacher account
  const registerTeacher = async (email, password, name) => {
    if (!navigator.onLine) {
      console.error("Cannot register while offline");
      return false;
    }
    
    try {
      console.log("Attempting to register teacher:", email);
      
      // ตรวจสอบว่าอีเมลที่ลงทะเบียนตรงกับอีเมลที่มีสิทธิ์หรือไม่
      const isAuthorized = email === AUTHORIZED_TEACHER_EMAIL;
      
      // หากไม่ใช่อีเมลที่มีสิทธิ์ แต่ทำการลงทะเบียนเป็นครู
      if (!isAuthorized) {
        console.warn("Teacher account registration from unauthorized email:", email);
        // ยังคงสร้างบัญชีให้ แต่จะมีสิทธิ์แค่การดูข้อมูลเท่านั้น
      }
      
      await setPersistence(auth, browserSessionPersistence);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(result.user, {
        displayName: name
      });
      
      // Save teacher data in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        email: email,
        displayName: name,
        userType: 'teacher',
        createdAt: new Date(),
        isAuthorizedTeacher: isAuthorized // เพิ่มฟิลด์สำหรับระบุว่าเป็นครูที่มีสิทธิ์หรือไม่
      });
      
      setUserType('teacher');
      setIsAuthorizedTeacher(isAuthorized);
      return true;
    } catch (error) {
      console.error("Error registering with email and password:", error);
      setIsAuthorizedTeacher(false);
      return false;
    }
  };

  // Password reset function
  const resetPassword = async (email) => {
    if (!navigator.onLine) {
      throw new Error("Cannot reset password while offline");
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  // Student login
  const loginStudent = async (studentId) => {
    try {
      console.log('Attempting to login student:', { studentId });
      
      if (!studentId || studentId.trim() === '') {
        console.error('Student ID is empty');
        return false;
      }
      
      if (!navigator.onLine) {
        console.error("Cannot login while offline");
        return false;
      }
      
      const apiUrl = 'http://mgt2.pnu.ac.th/safirde/auth_module/student_login.php';
      const params = new URLSearchParams();
      params.append('studentId', studentId.trim());
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });
      
      const responseText = await response.text();
      
      // ตรวจสอบว่า responseText เป็น JSON ที่ถูกต้อง
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('ไม่สามารถแปลงคำตอบเป็น JSON ได้:', e);
        return false;
      }
      
      if (data.status === 'error') {
        console.error('การเข้าสู่ระบบล้มเหลว:', data.message || 'ข้อผิดพลาดไม่ทราบ');
        return false;
      }
      
      if (!data.studentId) {
        console.error('การเข้าสู่ระบบล้มเหลว: ข้อมูลนักเรียนไม่ครบถ้วน');
        return false;
      }
      
      const studentUser = {
        uid: data.id || data.studentId,
        studentId: data.studentId,
        firstName: data.firstName,
        lastName: data.lastName
      };

      // อัปเดตสถานะของแอปพลิเคชัน
      setCurrentUser(studentUser);
      setUserType('student');
      setIsAuthorizedTeacher(false); // นักเรียนไม่ใช่ครูที่มีสิทธิ์
      
      // บันทึกข้อมูลผู้ใช้ลงใน localStorage
      localStorage.setItem('authToken', JSON.stringify(studentUser));
      localStorage.setItem('userType', 'student');
      
      return true;
    } catch (error) {
      console.error('รายละเอียดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
      return false;
    }
  };

  // Register student
  const registerStudent = async (studentId, firstName, lastName) => {
    try {
      console.log('Attempting to register student:', { studentId, firstName, lastName });
  
      // เพิ่มการตรวจสอบการเชื่อมต่อออนไลน์
      if (!navigator.onLine) {
        return { success: false, message: 'ไม่สามารถลงทะเบียนได้ในขณะไม่มีการเชื่อมต่ออินเทอร์เน็ต' };
      }
  
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!studentId || !firstName || !lastName) {
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' };
      }
  
      const params = new URLSearchParams();
      params.append('studentId', studentId.trim());
      params.append('firstName', firstName.trim());
      params.append('lastName', lastName.trim());
  
      console.log('Sending request with params:', params.toString());
  
      // เอา timeout option ออกเพราะ fetch API ไม่รองรับ
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
  
      const response = await fetch('http://mgt2.pnu.ac.th/safirde/auth_module/student_signup.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
  
      try {
        // พยายามแปลงข้อความเป็น JSON
        const data = JSON.parse(responseText);
        
        // ตรวจสอบ data.status เสมอ แม้ response จะเป็น 200
        if (data.status === 'success') {
          return { success: true, message: data.message || 'ลงทะเบียนสำเร็จ' };
        } else {
          return { 
            success: false, 
            message: data.message || `เกิดข้อผิดพลาด: ${response.status}` 
          };
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response text:', responseText);
        // ส่งคืนข้อความผิดพลาดที่ชัดเจน
        return { 
          success: false, 
          message: `เซิร์ฟเวอร์ส่งข้อมูลที่ไม่ถูกต้อง (${response.status})` 
        };
      }
    } catch (error) {
      console.error('Registration error details:', error);
      if (error.name === 'AbortError') {
        return { success: false, message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง' };
      }
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}` };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // If teacher using Firebase Auth
      if (userType === 'teacher' && auth.currentUser) {
        await signOut(auth);
      }
      
      // Clear user data and state
      setCurrentUser(null);
      setUserType(null);
      setIsAuthorizedTeacher(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('teacherCache');
      
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      
      // Still reset state even if there's an error
      setCurrentUser(null);
      setUserType(null);
      setIsAuthorizedTeacher(false);
      
      return false;
    }
  };

  const value = {
    currentUser,
    userType,
    loading,
    networkStatus,
    isAuthorizedTeacher, // เพิ่ม isAuthorizedTeacher เข้าไปในบริบท
    loginTeacher,
    registerTeacher,
    loginStudent,
    registerStudent,
    loginWithGoogle,
    logout,
    setUserType,
    resetPassword,
    checkAndCreateUserDoc
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};