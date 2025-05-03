import React, { useState,useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaFilePdf, FaFileExcel, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Dashboard.css';
import logoImage from '../assets/logo-acadamiPlan.png'; // Verify correct path
import { useNavigate } from 'react-router-dom';
  

const GenerateReport = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Generate Report');
  // State for all three report sections
  const [dates, setDates] = useState({
    conflict: { startDate: null, endDate: null },
    notification: { startDate: null, endDate: null },
    unresolved: { startDate: null, endDate: null }
  });

   useEffect(() => {
       const userData = JSON.parse(localStorage.getItem('user'));
       if (!userData) {
         navigate('/signin');
         return;
       }
       setUser(userData);
     }, [navigate]);
  
  const [downloadType, setDownloadType] = useState({
    conflict: 'PDF',
    notification: 'Excel',
    unresolved: 'Excel'
  });
  
  const [loading, setLoading] = useState({
    conflict: false,
    notification: false,
    unresolved: false
  });

  const handleDateChange = (type, field, date) => {
    setDates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: date
      }
    }));
  };

  const handleDownloadTypeChange = (type, value) => {
    setDownloadType(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Function to generate sample data based on report type
  const generateSampleData = (type) => {
    const baseData = {
      conflict: [
        { id: 1, course: 'MATH 101', instructor: 'Dr. Smith', conflictType: 'Schedule', date: '2023-05-15', status: 'Resolved' },
        { id: 2, course: 'PHYS 202', instructor: 'Dr. Johnson', conflictType: 'Resource', date: '2023-05-16', status: 'Pending' },
        { id: 3, course: 'CHEM 105', instructor: 'Dr. Williams', conflictType: 'Personnel', date: '2023-05-17', status: 'Resolved' }
      ],
      notification: [
        { id: 1, type: 'Alert', message: 'New conflict reported in MATH 101', date: '2023-05-15', read: 'Yes' },
        { id: 2, type: 'Reminder', message: 'Unresolved conflict in PHYS 202', date: '2023-05-16', read: 'No' },
        { id: 3, type: 'Update', message: 'Conflict resolved in CHEM 105', date: '2023-05-17', read: 'Yes' }
      ],
      unresolved: [
        { id: 1, course: 'PHYS 202', instructor: 'Dr. Johnson', daysOpen: 5, lastUpdate: '2023-05-16' },
        { id: 2, course: 'ENG 210', instructor: 'Dr. Brown', daysOpen: 3, lastUpdate: '2023-05-18' }
      ]
    };
    
    return baseData[type];
  };

  // Function to generate PDF report
  const generatePDF =async (type, data) => {
    const doc = new jsPDF();

    
  try {
    // Add logo (only if image is properly loaded)
    const imgData = await loadImage(logoImage);
    doc.addImage(imgData, 'PNG', 10, 10, 30, 30);
  } catch (error) {
    console.error('Failed to load image, using text instead:', error);
    doc.setFontSize(14);
    doc.text('ACADEMIPLAN', 15, 15);
  }

    
    // Add logo and title
    doc.text(`${type.replace(/([A-Z])/g, ' $1')} Report`, 105, 20, { align: 'center' });
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${dates[type].startDate.toLocaleDateString()} to ${dates[type].endDate.toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Add generated date
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
    
    // Prepare table data
    const headers = [Object.keys(data[0])];
    const rows = data.map(item => Object.values(item));
    
    // Add table
    autoTable(doc,{
      startY: 50,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { top: 50 }
    });
    
    // Save the PDF
    doc.save(`${type}-report-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Function to generate Excel report
  const generateExcel = (type, data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${type}-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleGenerateReport = (type) => {
    if (!dates[type].startDate || !dates[type].endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    setLoading(prev => ({...prev, [type]: true}));
    
    // Simulate API call delay
    setTimeout(() => {
      const reportData = generateSampleData(type);
      
      if (downloadType[type] === 'PDF') {
        generatePDF(type, reportData);
      } else {
        generateExcel(type, reportData);
      }
      
      setLoading(prev => ({...prev, [type]: false}));
    }, 1000);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Report section component to avoid repetition
  const ReportSection = ({ type, title }) => (
    <section className="report-section">
      <div className="report-header">
        <h3>{title}</h3>
        <div className="company-branding">
          <span>ACADEMIPLAN</span>
          <img 
            src={require('../assets/logo-acadamiPlan.png')} 
            alt="Company Logo" 
            className="report-logo"
          />
        </div>
      </div>
      
      <div className="report-controls">
        <div className="form-group">
          <label>Select Date Range</label>
          <div className="date-range-picker">
            <DatePicker
              selected={dates[type].startDate}
              onChange={(date) => handleDateChange(type, 'startDate', date)}
              placeholderText="Start Date"
              selectsStart
              startDate={dates[type].startDate}
              endDate={dates[type].endDate}
            />
            <DatePicker
              selected={dates[type].endDate}
              onChange={(date) => handleDateChange(type, 'endDate', date)}
              placeholderText="End Date"
              selectsEnd
              startDate={dates[type].startDate}
              endDate={dates[type].endDate}
              minDate={dates[type].startDate}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Select Download Type</label>
          <select
            value={downloadType[type]}
            onChange={(e) => handleDownloadTypeChange(type, e.target.value)}
          >
            <option value="PDF">PDF</option>
            <option value="Excel">Excel</option>
          </select>
          {downloadType[type] === 'PDF' ? (
            <FaFilePdf className="file-icon" />
          ) : (
            <FaFileExcel className="file-icon" />
          )}
        </div>
        
        <button 
          className="generate-btn"
          onClick={() => handleGenerateReport(type)}
          disabled={loading[type]}
        >
          {loading[type] ? (
            'Generating...'
          ) : (
            <>
              <FaDownload /> Generate Report
            </>
          )}
        </button>
      </div>
    </section>
  );

  return (
    <div className="dashboard-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img 
            src={require('../assets/compani-logo1.png')} 
            alt="AcademiPlan Logo" 
            className="logo-image"
          />
        </div>
        <nav>
          <ul>
            {['Dashboard', 'Conflict Resolution', 'Real Time Notifications', 'Generate Report','Course Enrollment','User Management'].map((item) => (
              <li 
                key={item} 
                className={activeTab === item ? 'active' : ''}
                onClick={() => setActiveTab(item)}
              >
                <Link to={`/${item.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h2 className="h2">Generate Report</h2>
          
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Type here to search..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="user-info">
            <button className="signout-btn" onClick={() => console.log('Signed out')}>
              Signout
            </button>
            {user?.profilePhoto ? (
              <img 
                src={`http://localhost:5000${user.profilePhoto}`}
                alt="Profile" 
                className="profile-pic"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'default-profile.png';
                }}
              />
            ) : (
              <div className="profile-pic">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-details">
              <span className="greeting">Hello {user?.username}</span>
              <span className="user-role">{user?.accountType}</span>
            </div>
          </div>
        </header>

        {/* Report Sections */}
        <div className="report-container">
          <ReportSection 
            type="conflict" 
            title="Generate Conflict Summary" 
          />
          
          <ReportSection 
            type="notification" 
            title="Notification History" 
          />
          
          <ReportSection 
            type="unresolved" 
            title="Unresolved Conflict Report" 
          />
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;