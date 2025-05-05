import { useState, useEffect } from "react";

export default function ARLinkForm({ selected, onSubmit, onCancel, labels = {} }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  // Set default labels if not provided
  const inputLabels = {
    firstInput: labels.firstInput || "ชื่อเนื้อหา",
    secondInput: labels.secondInput || "ลิงก์ AR"
  };

  // ใช้ useEffect เพื่อเติมข้อมูลฟอร์มเมื่อมีการเลือกรายการแก้ไข
  useEffect(() => {
    if (selected) {
      setTitle(selected.link_name || "");
      setLink(selected.url || "");
    } else {
      setTitle("");
      setLink("");
    }
  }, [selected]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      id: selected ? selected.id : null,
      link_name: title,
      url: link, 
    });
    // รีเซ็ตฟอร์มถ้าไม่ได้อยู่ในโหมดแก้ไข
    if (!selected) {
      setTitle("");
      setLink("");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setLink("");
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="ar-form">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="content-title">
              {inputLabels.firstInput}
            </label>
            <input
              id="content-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ar-link">
              {inputLabels.secondInput}
            </label>
            <input
              id="ar-link"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="form-input"
              required
              placeholder="https://"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button">
            {selected ? "อัปเดตลิงก์" : "เพิ่มลิงก์ใหม่"}
          </button>
          
          {selected && (
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancel}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>
    </div>
  );
}