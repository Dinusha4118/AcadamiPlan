import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const ConflictResolution = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Conflict Resolution');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [filteredConflicts, setFilteredConflicts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conflicts from backend
  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          navigate('/signin');
          return;
        }
        setUser(userData);
    
        const response = await axios.get('http://localhost:5000/api/timetable/conflicts');
        
        console.log('API Response:', response.data); // Debugging log
        
        if (response.data && Array.isArray(response.data)) {
          setConflicts(response.data);
          setFilteredConflicts(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid data format received from server');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch conflicts');
        setIsLoading(false);
      }
    };

    fetchConflicts();
  }, [navigate]);

  // Filter conflicts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConflicts(conflicts);
      setSearchError('');
      return;
    }

    if (searchQuery.length < 3) {
      setSearchError('Search term must be at least 3 characters');
      return;
    } else {
      setSearchError('');
    }

    const filtered = conflicts.filter(conflict => {
      const query = searchQuery.toLowerCase();
      return (
        conflict.timetableEntry.courseName.toLowerCase().includes(query) ||
        conflict.timetableEntry.courseCode.toLowerCase().includes(query) ||
        conflict.timetableEntry.lecturer.toLowerCase().includes(query) ||
        conflict.timetableEntry.lectureHall.toLowerCase().includes(query) ||
        conflict.timetableEntry.timeSlot.toLowerCase().includes(query) ||
        conflict.status.toLowerCase().includes(query) ||
        conflict._id.toString().includes(query)
      );
    });

    setFilteredConflicts(filtered);
  }, [searchQuery, conflicts]);

  const generatePDFReport = () => {
    // Create new jsPDF instance
    const doc = new jsPDF();
    
    // Add logo
    const logoUrl = require('../assets/logo-acadamiPlan.png');
    doc.addImage(logoUrl, 'PNG', 20, 15, 35, 20);
    
    // Report title and company info
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Conflict Resolution Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('AcademiPlan Solutions', 105, 30, { align: 'center' });
    doc.text('Mo 34/60, Wijerama Road, Colombo 07', 105, 35, { align: 'center' });
    doc.text('Phone: 0764456789 | Email: info@academiplan.com', 105, 40, { align: 'center' });
    
    // Date
    const today = new Date();
    doc.text(`Generated on: ${today.toLocaleDateString()}`, 15, 45);
    
    // Table data
    const headers = [
      'ID', 
      'Course', 
      'Code', 
      'Lecturer', 
      'Hall', 
      'Time', 
      'Status', 
      'Conflicts'
    ];
    
    const tableData = filteredConflicts.map(conflict => [
      `#${conflict._id?.substring(0, 6)}`,
      conflict.timetableEntry?.courseName || 'N/A',
      conflict.timetableEntry?.courseCode || 'N/A',
      conflict.timetableEntry?.lecturer || 'N/A',
      conflict.timetableEntry?.lectureHall || 'N/A',
      `${conflict.timetableEntry?.day || 'N/A'}, ${conflict.timetableEntry?.timeSlot || 'N/A'}`,
      conflict.status === 'resolved' ? 'Resolved' : 'Pending',
      conflict.conflictingEntries?.length || 0
    ]);
    
    // Add table using autoTable plugin
    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 50 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // ID
        1: { cellWidth: 30 }, // Course
        2: { cellWidth: 20 }, // Code
        3: { cellWidth: 30 }, // Lecturer
        4: { cellWidth: 20 }, // Hall
        5: { cellWidth: 30 }, // Time
        6: { cellWidth: 20 }, // Status
        7: { cellWidth: 15 }  // Conflicts
      }
    });
    
    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save('Conflict_Resolution_Report.pdf');
  };


  const handleResolve = async (conflictId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/timetable/conflicts/${conflictId}/resolve`,
        { action: 'reschedule', newTimeSlot: '11:00-12:30', newLectureHall: 'G102' }
      );
  
      if (response.data.message === 'Conflict resolved successfully') {
        navigate('/real-time-notifications');
      } else {
        alert('Resolution completed but navigation skipped');
      }
    } catch (err) {
      console.error('Resolve error:', err);
      setError(err.response?.data?.message || 'Failed to resolve conflict');
    }
  };

  const handleDelete = async (conflictId) => {
    if (!window.confirm('Are you sure you want to delete this conflict?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/timetable/conflicts/${conflictId}`);
      
      setConflicts(conflicts.filter(conflict => conflict._id !== conflictId));
      setFilteredConflicts(filteredConflicts.filter(conflict => conflict._id !== conflictId));
      
      alert('Conflict deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete conflict');
    }
  };
  
  const handleEdit = async (conflictId) => {
    try {
      const conflict = conflicts.find(c => c._id === conflictId);
      if (!conflict) return;
  
      const updatedData = {
        courseCode: conflict.timetableEntry.courseCode,
        courseName: conflict.timetableEntry.courseName,
        lecturer: prompt("Enter new lecturer:", conflict.timetableEntry.lecturer),
        day: conflict.timetableEntry.day,
        timeSlot: conflict.timetableEntry.timeSlot,
        lectureHall: prompt("Enter new lecture hall:", conflict.timetableEntry.lectureHall),
        color: conflict.timetableEntry.color
      };
  
      await axios.put(
        `http://localhost:5000/api/timetable/${conflict.timetableEntry._id}`,
        updatedData
      );
  
      const response = await axios.get('http://localhost:5000/api/timetable/conflicts');
      setConflicts(response.data);
      setFilteredConflicts(response.data);
      
      alert('Entry updated successfully!');
    } catch (err) {
      console.error('Edit error:', err);
      setError(err.response?.data?.message || 'Failed to update entry');
    }
  };

  const handleViewDetails = (conflict) => {
    setSelectedConflict({
      ...conflict,
      conflictingCourses: conflict.conflictingEntries.map(entry => ({
        id: entry._id,
        name: entry.courseName,
        code: entry.courseCode,
        lecturer: entry.lecturer,
        time: entry.timeSlot,
        hall: entry.lectureHall
      })),
      involvedLecturers: Array.from(new Set(
        [conflict.timetableEntry.lecturer, ...conflict.conflictingEntries.map(e => e.lecturer)]
      )).map(lecturer => ({
        id: lecturer.replace(/\s+/g, '-').toLowerCase(),
        name: lecturer
      })),
      suggestedSolutions: conflict.suggestedSolutions
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConflict(null);
  };

  const ConflictDetailsModal = () => (
    <div className="modal-overlay">
      <div className="conflict-modal">
        <div className="modal-header">
          <h3>Conflict Details - ID: {selectedConflict?._id}</h3>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="detail-section">
            <h4>Basic Information</h4>
            <p><strong>Course Name:</strong> {selectedConflict?.timetableEntry?.courseName}</p>
            <p><strong>Course Code:</strong> {selectedConflict?.timetableEntry?.courseCode}</p>
            <p><strong>Lecture Hall:</strong> {selectedConflict?.timetableEntry?.lectureHall}</p>
            <p><strong>Time Slot:</strong> {selectedConflict?.timetableEntry?.timeSlot}</p>
            <p><strong>Day:</strong> {selectedConflict?.timetableEntry?.day}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge ${selectedConflict?.status === 'resolved' ? 'resolved' : 'pending'}`}>
                {selectedConflict?.status === 'resolved' ? 'Resolved' : 'Pending'}
              </span>
            </p>
          </div>

          <div className="detail-section">
            <h4>Conflicting Courses</h4>
            <ul>
              {selectedConflict?.conflictingCourses?.map(course => (
                <li key={course.id}>
                  {course.name} ({course.code}) - {course.time} in {course.hall} with {course.lecturer}
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h4>Involved Lecturers</h4>
            <ul>
              {selectedConflict?.involvedLecturers?.map(lecturer => (
                <li key={lecturer.id}>{lecturer.name}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h4>Suggested Solutions</h4>
            <ol>
              {selectedConflict?.suggestedSolutions?.map((solution, index) => (
                <li key={index}>{solution.solution}</li>
              ))}
            </ol>
          </div>

          <div className="modal-actions">
            <button 
              className="approve-btn"
              onClick={() => {
                handleResolve(selectedConflict._id);
                closeModal();
              }}
            >
              Approve Solution
            </button>
            <button className="reject-btn" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="dashboard-container">Loading conflicts...</div>;
  }

  if (error) {
    return <div className="dashboard-container">Error: {error}</div>;
  }

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
            {['Dashboard', 'Conflict Resolution', 'Real Time Notifications','Course Enrollment','User Management'].map((item) => (
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
          <h2 className="h2">Conflict Resolution</h2>
            <div className="search-container">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search by course, lecturer, hall..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={searchError ? 'error' : ''}
              />
              {searchError && <span className="search-error">{searchError}</span>}
            </div>
            <div className="user-info">
              <button className="signout-btn" onClick={() => {
                localStorage.removeItem('user');
                navigate('/signin');
              }}>
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

        <button className="pdf-btn" onClick={generatePDFReport}>
              Generate PDF Report
         </button>

        {/* Conflicts Table */}
        <div className="conflicts-table">
          {filteredConflicts.length === 0 ? (
            <div className="no-results">
              {searchQuery ? `No conflicts found for "${searchQuery}"` : 'No conflicts detected'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Conflict ID</th>
                  <th>Course Name</th>
                  <th>Course Code</th>
                  <th>Lecturer</th>
                  <th>Lecture Hall</th>
                  <th>Day & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConflicts.map((conflict) => (
                  <tr key={conflict._id}>
                    <td>#{conflict._id?.substring(0, 6)}</td>
                    <td>{conflict.timetableEntry?.courseName || 'N/A'}</td>
                    <td>{conflict.timetableEntry?.courseCode || 'N/A'}</td>
                    <td>{conflict.timetableEntry?.lecturer || 'N/A'}</td>
                    <td>{conflict.timetableEntry?.lectureHall || 'N/A'}</td>
                    <td>
                      {conflict.timetableEntry?.day || 'N/A'}, {conflict.timetableEntry?.timeSlot || 'N/A'}
                      <br />
                      <small>Conflicts with {conflict.conflictingEntries?.length || 0} other course(s)</small>
                    </td>
                    <td>
                      <span className={`status-badge ${conflict.status === 'resolved' ? 'resolved' : 'pending'}`}>
                        {conflict.status === 'resolved' ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`resolve-btn ${conflict.status === 'resolved' ? 'resolved' : ''}`}
                        onClick={() => handleViewDetails(conflict)}
                      >
                        {conflict.status === 'resolved' ? 'Resolved' : 'Resolve'}
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(conflict._id)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(conflict._id)}
                      >
                        🗑️ Delete
                      </button>
                      <button 
                        className="details-btn"
                        onClick={() => handleViewDetails(conflict)}
                      >
                        🔍 Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Modal */}
      {isModalOpen && <ConflictDetailsModal />}
    </div>
  );
};

export default ConflictResolution;