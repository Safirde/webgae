import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeacherLayout from "../components/TeacherLayout";
import { useAuth } from '../component01/AuthContext';
import "../styles/ARDashboard.css";

export default function ARDashboard() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ id: null, link_name: "", url: "" });
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { userType, isAuthorizedTeacher } = useAuth();
  
  // โหลดข้อมูลลิงก์ AR จาก API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://mgt2.pnu.ac.th/safirde/ar_content_db/get_ar_links.php");
      const data = await res.json();
      
      console.log("Raw API response:", data);
      
      // ตรวจสอบโครงสร้างข้อมูลและแปลงให้เป็นอาร์เรย์ที่ใช้งานได้
      let processedData = [];
      
      if (Array.isArray(data)) {
        // กรณีที่ API ส่งอาร์เรย์มาโดยตรง
        processedData = data;
      } else if (data && typeof data === 'object') {
        // กรณีที่ API ส่งข้อมูลในรูปแบบ object
        if (Array.isArray(data.data)) {
          // กรณี { status: "success", data: [...] }
          processedData = data.data;
        } else if (Object.values(data).some(item => typeof item === 'object')) {
          // กรณีที่เป็น object ที่มี properties เป็น objects (เช่น {0: {...}, 1: {...}})
          processedData = Object.values(data).filter(item => typeof item === 'object');
        }
      }
      
      // แสดงข้อมูลในคอนโซลเพื่อดีบัก
      console.log("Processed data:", processedData);
      
      // สำหรับแต่ละรายการ ให้ตรวจสอบว่ามีฟิลด์ที่จำเป็นหรือไม่
      const validData = processedData.map(item => {
        return {
          id: item.id,
          link_name: item.link_name || item.title || '',
          url: item.url || item.ar_link || ''
        };
      });
      
      console.log("Standardized data:", validData);
      setData(validData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ตรวจสอบว่าเป็นครูหรือไม่
    if (userType === 'teacher') {
      // ทุกคนที่เป็นครูสามารถดูข้อมูลได้
      fetchData();
    } else {
      // ถ้าไม่ใช่ครู ให้เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
      navigate("/auth");
    }
  }, [userType, navigate]);

  // ฟังก์ชันจัดการการเปลี่ยนแปลงของฟอร์ม
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // เพิ่มหรือแก้ไขลิงก์ AR
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการเพิ่มหรือแก้ไขลิงก์ AR");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const url = editId
        ? "http://mgt2.pnu.ac.th/safirde/ar_content_db/update_ar_link.php"
        : "http://mgt2.pnu.ac.th/safirde/ar_content_db/add_ar_link.php";
      
      // สร้างข้อมูลที่จะส่งไป
      const submitData = {
        id: form.id,
        link_name: form.link_name,
        url: form.url
      };
      
      console.log("Submitting data:", submitData);
      
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      
      fetchData();
      setForm({ id: null, link_name: "", url: "" });
      setEditId(null);
    } catch (error) {
      console.error("Error saving AR link:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบลิงก์ AR
  const handleDelete = async (id) => {
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการลบลิงก์ AR");
      return;
    }
    
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบลิงก์ AR นี้?")) return;
    
    try {
      setIsLoading(true);
      await fetch("http://mgt2.pnu.ac.th/safirde/ar_content_db/delete_ar_link.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting AR link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ตั้งค่าแก้ไข
  const handleEdit = (item) => {
    // ตรวจสอบว่าเป็นครูที่มีสิทธิ์หรือไม่
    if (!isAuthorizedTeacher) {
      alert("คุณไม่มีสิทธิ์ในการแก้ไขลิงก์ AR");
      return;
    }
    
    console.log("Editing item:", item);
    
    // กำหนดค่าใหม่ให้กับฟอร์ม
    const formData = {
      id: item.id,
      link_name: item.link_name || item.title || '',
      url: item.url || item.ar_link || ''
    };
    
    setForm(formData);
    setEditId(item.id);
    
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
  const filteredData = data.filter((item) => {
    const name = String(item.link_name || item.title || '').toLowerCase();
    const url = String(item.url || item.ar_link || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || url.includes(query);
  });

  return (
    <TeacherLayout title="จัดการเนื้อหา AR">
      <div className="ar-content-manager">
        <div className="content-card">
          {/* แสดงฟอร์มเพิ่ม/แก้ไขลิงก์ AR เฉพาะครูที่มีสิทธิ์เท่านั้น */}
          {isAuthorizedTeacher && (
            <form onSubmit={handleSubmit} className="student-form">
              <h3 className="form-title">{editId ? "แก้ไขลิงก์ AR" : "เพิ่มลิงก์ AR ใหม่"}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="link_name">ชื่อเนื้อหา</label>
                  <input 
                    id="link_name"
                    className="form-input" 
                    name="link_name" 
                    value={form.link_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="กรอกชื่อเนื้อหา"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="url">ลิงก์ AR</label>
                  <input 
                    id="url"
                    className="form-input" 
                    name="url" 
                    value={form.url} 
                    onChange={handleChange} 
                    required 
                    placeholder="https://"
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
                  {isSubmitting ? "กำลังบันทึก..." : editId ? "อัปเดต" : "เพิ่มลิงก์ AR"}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setForm({ id: null, link_name: "", url: "" });
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
              <p>คุณอยู่ในโหมดดูข้อมูลเท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบลิงก์ AR ได้</p>
            </div>
          )}

          <div className="ar-content-section">
            <div className="table-header">
              <h3 className="table-title"></h3>
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="ค้นหาเนื้อหา AR..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <button 
                  className="refresh-button" 
                  onClick={fetchData} 
                  disabled={isLoading}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="ar-links-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>ชื่อเนื้อหา</th>
                    <th style={{ width: isAuthorizedTeacher ? "45%" : "70%" }}>ลิงก์ AR</th>
                    {isAuthorizedTeacher && <th style={{ width: "25%" }}>จัดการ</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={isAuthorizedTeacher ? "3" : "2"} className="no-data">กำลังโหลดข้อมูล...</td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.link_name || item.title || ''}</td>
                        <td>
                          <a 
                            href={item.url || item.ar_link || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ar-link-url"
                          >
                            {item.url || item.ar_link || ''}
                          </a>
                        </td>
                        {isAuthorizedTeacher && (
                          <td className="action-cell">
                            <div className="action-container">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(item);
                                }}
                                className="edit-button"
                                title="แก้ไข"
                              >
                                แก้ไข
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                className="delete-button"
                                title="ลบ"
                              >
                                ลบ
                              </button>
                              <a 
                                href={item.url || item.ar_link || '#'} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-button"
                                title="เปิดลิงก์ AR"
                              >
                                เปิด
                              </a>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAuthorizedTeacher ? "3" : "2"} className="no-data">
                        {searchQuery ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"` : "ยังไม่มีเนื้อหา AR"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="table-info">
              แสดงข้อมูล {filteredData.length} จาก {data.length} รายการ
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}