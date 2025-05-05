import React, { useState, useEffect } from 'react';

export default function ARLinkTable({ onEdit, onDelete, isAuthorizedTeacher }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch("http://mgt2.pnu.ac.th/safirde/ar_content_db/get_ar_links.php")
      .then((res) => res.json())
      .then((result) => {
        console.log("ข้อมูลที่ได้รับจาก API:", result);
        
        // ตรวจสอบโครงสร้างข้อมูลและแปลงให้เป็นอาร์เรย์ที่ใช้งานได้
        let processedData = [];
        
        if (Array.isArray(result)) {
          // กรณีที่ API ส่งอาร์เรย์มาโดยตรง
          processedData = result;
        } else if (result && typeof result === 'object') {
          // กรณีที่ API ส่งข้อมูลในรูปแบบ object
          if (Array.isArray(result.data)) {
            // กรณี { status: "success", data: [...] }
            processedData = result.data;
          } else if (Object.values(result).some(item => typeof item === 'object')) {
            // กรณีที่เป็น object ที่มี properties เป็น objects (เช่น {0: {...}, 1: {...}})
            processedData = Object.values(result).filter(item => typeof item === 'object');
          }
        }
        
        console.log("ข้อมูลหลังการแปลง:", processedData);
        setData(processedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError("ไม่สามารถโหลดข้อมูลได้");
        setLoading(false);
      });
  }, []);

  const handleEdit = (item) => {
    if (!isAuthorizedTeacher) {
      alert("เฉพาะบัญชี niyakadee165@gmail.com เท่านั้นที่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }
    onEdit(item);
    
    // Scroll to the form
    const formSection = document.querySelector('.ar-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredData = data.filter(item => {
    const name = (item.link_name || item.title || '').toLowerCase();
    const url = (item.url || item.ar_link || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return name.includes(term) || url.includes(term);
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="ar-table-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="ค้นหาเนื้อหา AR..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button 
          className="refresh-button"
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>
      
      {!Array.isArray(filteredData) || filteredData.length === 0 ? (
        <div className="no-links">
          {searchTerm ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` : "ยังไม่มีเนื้อหา AR"}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="ar-links-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>ชื่อเนื้อหา</th>
                  <th>ลิงก์ AR</th>
                  <th style={{ width: "120px" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.link_name || item.title}</td>
                    <td>
                      <a 
                        href={item.url || item.ar_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ar-link-url"
                      >
                        {item.url || item.ar_link}
                      </a>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-button edit-button"
                          onClick={() => handleEdit(item)}
                          disabled={!isAuthorizedTeacher}
                          title="แก้ไข"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="action-button delete-button"
                          onClick={() => {
                            if (!isAuthorizedTeacher) {
                              alert("เฉพาะบัญชี niyakadee165@gmail.com เท่านั้นที่มีสิทธิ์ลบข้อมูล");
                              return;
                            }
                            onDelete(item.id);
                          }}
                          disabled={!isAuthorizedTeacher}
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <a 
                          href={item.url || item.ar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-button view-button"
                          title="เปิดลิงก์"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="table-info">
            แสดงข้อมูล {filteredData.length} จาก {data.length} รายการ
          </div>
        </>
      )}
    </div>
  );
}