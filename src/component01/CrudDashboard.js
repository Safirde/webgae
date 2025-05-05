import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeacherLayout from "../components/TeacherLayout";
import { useAuth } from './AuthContext';
import "../styles/CrudDashboard.css";

export default function CrudDashboard() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_id: "", first_name: "", last_name: "" });
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { userType, isAuthorizedTeacher } = useAuth();
  
  // โหลดข้อมูลนักเรียนจาก API
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://mgt2.pnu.ac.th/safirde/auth_module/get_student.php");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ตรวจสอบว่าเป็นครูหรือไม่
    if (userType === 'teacher') {
      // ทุกคนที่เป็นครูสามารถดูข้อมูลได้
      fetchStudents();
    } else {
      // ถ้าไม่ใช่ครู ให้เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
      navigate("/auth");
    }
  }, [userType, navigate]); 

  // ฟังก์ชันจัดการการเปลี่ยนแปลงของฟอร์ม
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // เพิ่มหรือแก้ไขนักเรียน
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการเพิ่มหรือแก้ไขข้อมูลนักเรียน");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const url = editId
        ? "http://mgt2.pnu.ac.th/safirde/auth_module/update_student.php"
        : "http://mgt2.pnu.ac.th/safirde/auth_module/add_student.php";
      
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      fetchStudents();
      setForm({ student_id: "", first_name: "", last_name: "" });
      setEditId(null);
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบนักเรียน
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    console.log('Delete button clicked for student ID:', id);
    
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการลบข้อมูลนักเรียน");
      return;
    }
    
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้?")) return;
    try {
      setIsLoading(true);
      await fetch("http://mgt2.pnu.ac.th/safirde/auth_module/delete_student.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: id }),
      });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ตั้งค่าแก้ไข
  const handleEdit = (student, e) => {
    if (e) e.stopPropagation();
    console.log('Edit button clicked for student:', student.student_id);
    
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนักเรียน");
      return;
    }
    
    setForm(student);
    setEditId(student.student_id);
    
    // เลื่อนไปยังส่วนบนของหน้าเพื่อเห็นฟอร์ม
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // ฟังก์ชันการค้นหา
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // กรองข้อมูลตามคำค้นหา
  const filteredStudents = students.filter((student) =>
    student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeacherLayout title="จัดการข้อมูลนักเรียน">
      <div className="student-manager">
        <div className="content-card">
          {/* แสดงฟอร์มเพิ่ม/แก้ไขนักเรียน เฉพาะครูที่มีสิทธิ์เท่านั้น */}
          {isAuthorizedTeacher && (
            <form onSubmit={handleSubmit} className="student-form">
              <h3 className="form-title">{editId ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="student_id">รหัสนักเรียน</label>
                  <input 
                    id="student_id"
                    className="form-input" 
                    name="student_id" 
                    value={form.student_id} 
                    onChange={handleChange} 
                    required 
                    placeholder="กรอกรหัสนักเรียน"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="first_name">ชื่อ</label>
                  <input 
                    id="first_name"
                    className="form-input" 
                    name="first_name" 
                    value={form.first_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="กรอกชื่อ"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">นามสกุล</label>
                  <input 
                    id="last_name"
                    className="form-input" 
                    name="last_name" 
                    value={form.last_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="กรอกนามสกุล"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`submit-button ${editId ? "edit-mode" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังบันทึก..." : editId ? "อัปเดต" : "เพิ่มนักเรียน"}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setForm({ student_id: "", first_name: "", last_name: "" });
                      setEditId(null);
                    }}
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          )}
          
          {!isAuthorizedTeacher && (
            <div className="view-only-message">
              <p>คุณอยู่ในโหมดดูข้อมูลเท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบข้อมูลนักเรียนได้</p>
            </div>
          )}

          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title"></h3>
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="ค้นหานักเรียน (รหัส, ชื่อ หรือนามสกุล)"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <button className="refresh-button" onClick={fetchStudents} disabled={isLoading}>
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ</th>
                    <th>นามสกุล</th>
                    {isAuthorizedTeacher && <th>จัดการ</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={isAuthorizedTeacher ? "4" : "3"} className="no-data">กำลังโหลดข้อมูล...</td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_id}</td>
                        <td>{student.first_name}</td>
                        <td>{student.last_name}</td>
                        {isAuthorizedTeacher && (
                          <td className="action-cell">
                            <div className="action-container">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(student, e);
                                }}
                                className="edit-button"
                              >
                                แก้ไข
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(student.student_id, e);
                                }}
                                className="delete-button"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAuthorizedTeacher ? "4" : "3"} className="no-data">ไม่พบข้อมูลนักเรียน</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="table-info">
              แสดงข้อมูล {filteredStudents.length} จาก {students.length} รายการ
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}