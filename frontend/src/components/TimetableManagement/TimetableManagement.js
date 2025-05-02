import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import '../Dashboard.css';

const TimeTableManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Time Table Management');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['08:00-09:30', '09:30-11:00', '11:00-12:30', '12:30-14:00', '14:00-15:30', '15:30-17:00'];

  const [newEntry, setNewEntry] = useState({
    courseCode: '',
    courseName: '',
    lecturer: '',
    day: 'Monday',
    timeSlot: '08:00-09:30',
    lectureHall: '',
    color: '#D3D3D3'
  });

  useEffect(() => {
    const fetchUserAndData = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || userData.accountType !== 'Lecturer') {
        navigate('/signin');
        return;
      }
      setUser(userData);

      try {
        const response = await axios.get('http://localhost:5000/api/timetable');
        setTimetable(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch timetable');
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(timetable);
      setSearchError('');
      return;
    }

    if (searchQuery.length < 2) {
      setSearchError('Search term must be at least 2 characters');
      return;
    } else {
      setSearchError('');
    }

    const filtered = timetable.filter(entry => {
      const query = searchQuery.toLowerCase();
      return (
        entry.courseCode?.toLowerCase().includes(query) ||
        entry.courseName?.toLowerCase().includes(query) ||
        entry.lecturer?.toLowerCase().includes(query) ||
        entry.lectureHall?.toLowerCase().includes(query) ||
        entry.day?.toLowerCase().includes(query) ||
        entry.timeSlot?.toLowerCase().includes(query)
      );
    });

    setFilteredEntries(filtered);
  }, [searchQuery, timetable]);

  const generatePDFReport = () => {
    // Create new jsPDF instance
    const doc = new jsPDF();
    
    // Add logo
    const logoUrl = require('../../assets/logo-acadamiPlan.png');
    doc.addImage(logoUrl, 'PNG', 20, 15, 35, 20);
    
    // Report title and company info
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Timetable Management Report', 105, 20, { align: 'center' });
    
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
      '#', 
      'Course Code', 
      'Course Name', 
      'Lecturer', 
      'Day', 
      'Time Slot', 
      'Lecture Hall'
    ];
    
    const tableData = filteredEntries.map((entry, index) => [
      index + 1,
      entry.courseCode || 'N/A',
      entry.courseName || 'N/A',
      entry.lecturer || 'N/A',
      entry.day || 'N/A',
      entry.timeSlot || 'N/A',
      entry.lectureHall || 'N/A'
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
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 25 }, // Course Code
        2: { cellWidth: 40 }, // Course Name
        3: { cellWidth: 30 }, // Lecturer
        4: { cellWidth: 20 }, // Day
        5: { cellWidth: 25 }, // Time Slot
        6: { cellWidth: 25 }  // Lecture Hall
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
    
    doc.save('Timetable_Management_Report.pdf');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (modalType === 'add') {
      setNewEntry(prev => ({ ...prev, [name]: value }));
    } else {
      setSelectedEntry(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEntry = () => {
    setModalType('add');
    setNewEntry({
      courseCode: '',
      courseName: '',
      lecturer: '',
      day: 'Monday',
      timeSlot: '08:00-09:30',
      lectureHall: '',
      color: '#D3D3D3'
    });
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setModalType('edit');
    setSelectedEntry({ ...entry });
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (id) => {
    if (!id) {
      setError('Invalid entry ID');
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/timetable/${id}`);
      if (response.status === 200) {
        setTimetable(prev => prev.filter(entry => entry._id !== id));
        setFilteredEntries(prev => prev.filter(entry => entry._id !== id));
      }
    } catch (err) {
      console.error('Delete error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to delete entry. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const entryData = modalType === 'add' ? newEntry : selectedEntry;
      const response = await axios.post('http://localhost:5000/api/timetable', entryData);
  
      // Always add the entry to the timetable
      setTimetable(prev => [...prev, response.data.entry]);
      setFilteredEntries(prev => [...prev, response.data.entry]);
  
      if (response.data.conflictExists) {
        // Show warning but don't prevent creation
        alert(`Entry created but conflicts detected with other courses in ${entryData.lectureHall} at ${entryData.timeSlot}`);
        
        // Optionally refresh conflicts list
        const conflictsResponse = await axios.get('http://localhost:5000/api/timetable/conflicts');
        setConflicts(conflictsResponse.data);
      }
  
      setIsModalOpen(false);
    } catch (err) {
      console.error('Submission error:', err);
      
      // Differentiate between actual errors and conflict warnings
      if (err.response?.status === 409) {
        // This should theoretically never happen now, but handle just in case
        alert('The system detected a scheduling conflict. The entry was still created.');
      } else {
        setError(err.response?.data?.message || 'Failed to create entry');
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(timetable);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTimetable(items);

    try {
      await axios.post('http://localhost:5000/api/timetable/reorder', {
        entries: items.map(item => item._id)
      });
    } catch (err) {
      setError('Failed to save new order');
    }
  };

  const TimeTableModal = () => (
    <div className="modal-overlay">
      <div className="conflict-modal">
        <div className="modal-header">
          <h3>{modalType === 'add' ? 'Add New Timetable Entry' : 'Edit Timetable Entry'}</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            {['courseCode', 'courseName', 'lecturer', 'lectureHall'].map((field) => (
              <div className="form-group" key={field}>
                <label>{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  name={field}
                  value={modalType === 'add' ? newEntry[field] : selectedEntry[field]}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ))}
            <div className="form-group">
              <label>Day</label>
              <select 
                name="day" 
                value={modalType === 'add' ? newEntry.day : selectedEntry.day} 
                onChange={handleInputChange}
              >
                {days.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Time Slot</label>
              <select 
                name="timeSlot" 
                value={modalType === 'add' ? newEntry.timeSlot : selectedEntry.timeSlot} 
                onChange={handleInputChange}
              >
                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                name="color"
                value={modalType === 'add' ? newEntry.color : selectedEntry.color}
                onChange={handleInputChange}
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="approve-btn">
                {modalType === 'add' ? 'Add Entry' : 'Save Changes'}
              </button>
              <button type="button" className="reject-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="dashboard-container"><div className="main-content">Loading timetable...</div></div>;

  return (
    <div className="dashboard-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img 
            src={require('../../assets/compani-logo1.png')} 
            alt="AcademiPlan Logo" 
            className="logo-image"
          />
        </div>
        <nav>
          <ul>
            <li 
              className={activeTab === 'Time Table Management' ? 'active' : ''}
              onClick={() => setActiveTab('Time Table Management')}
            >
              <Link to="/timetable-management" style={{ textDecoration: 'none', color: 'inherit' }}>
                Time Table Management
              </Link>
            </li>
            <li 
              className={activeTab === 'Lecture Hall Allocation' ? 'active' : ''}
              onClick={() => setActiveTab('Lecture Hall Allocation')}
            >
              <Link to="/Lecture-HallAllocation" style={{ textDecoration: 'none', color: 'inherit' }}>
                Lecture Hall Allocation
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <h2 className="h2">Time Table Management</h2>
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search timetable entries..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className={searchError ? 'error' : ''}
            />
            {searchError && <span className="search-error">{searchError}</span>}
          </div>
          <div className="user-info">
            <button className="signout-btn" onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              navigate('/signin');
            }}>
              Signout
            </button>
            {user?.profilePhoto ? (
              <img 
                src={`http://localhost:5000${user.profilePhoto}`}
                alt="Profile" 
                className="profile-pic"
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

        {error && <div className="error-message">{error}</div>}

        <div className="timetable-controls">
          <button className="add-btn" onClick={handleAddEntry}>+ Add New Entry</button>
          <button className="generate-pdf-btn" onClick={generatePDFReport}>Generate Report PDF</button>
        </div>

        <div className="conflicts-table">
          <DragDropContext onDragEnd={handleDragEnd}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Lecturer</th>
                  <th>Day</th>
                  <th>Time Slot</th>
                  <th>Lecture Hall</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <Droppable droppableId="timetable">
                {(provided) => (
                  <tbody
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {filteredEntries.map((entry, index) => (
                      <Draggable key={entry._id} draggableId={entry._id} index={index}>
                        {(provided) => (
                          <tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              backgroundColor: entry.color,
                              ...provided.draggableProps.style
                            }}
                          >
                            <td>{index + 1}</td>
                            <td>{entry.courseCode}</td>
                            <td>{entry.courseName}</td>
                            <td>{entry.lecturer}</td>
                            <td>{entry.day}</td>
                            <td>{entry.timeSlot}</td>
                            <td>{entry.lectureHall}</td>
                            <td>
                              <button 
                                className="edit-btn" 
                                onClick={() => handleEditEntry(entry)}
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                className="delete-btn" 
                                onClick={() => handleDeleteEntry(entry._id)}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </DragDropContext>
        </div>
        {isModalOpen && <TimeTableModal />}
      </div>
    </div>
  );
};

export default TimeTableManagement;