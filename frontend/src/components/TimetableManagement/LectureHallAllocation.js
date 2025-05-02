import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../Dashboard.css';

const LectureHallAllocation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Lecture Hall Allocation');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedHall, setSelectedHall] = useState(null);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [lectureHalls, setLectureHalls] = useState([]);
  const [newHall, setNewHall] = useState({
    hallCode: '',
    capacity: '',
    facilities: [],
    building: '',
    status: 'Available'
  });
  const [newFacility, setNewFacility] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/lecture-halls');
        setLectureHalls(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch lecture halls');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHalls(lectureHalls);
      setSearchError('');
      return;
    }

    if (searchQuery.length < 2) {
      setSearchError('Search term must be at least 2 characters');
      return;
    } else {
      setSearchError('');
    }

    const filtered = lectureHalls.filter(hall => {
      const query = searchQuery.toLowerCase();
      return (
        hall.hallCode.toLowerCase().includes(query) ||
        hall.building.toLowerCase().includes(query) ||
        hall.status.toLowerCase().includes(query) ||
        hall.facilities.join(', ').toLowerCase().includes(query) ||
        hall.capacity.toString().includes(query)
      );
    });

    setFilteredHalls(filtered);
  }, [searchQuery, lectureHalls]);

  const generatePDF = () => {
    // Create new jsPDF instance
    const doc = new jsPDF();
    
    // Add logo
    const logoUrl = require('../../assets/logo-acadamiPlan.png');
    doc.addImage(logoUrl, 'PNG', 20, 15, 35, 20);
    
    // Report title and company info
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Lecture Hall Allocation Report', 105, 20, { align: 'center' });
    
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
      'Hall Code', 
      'Building', 
      'Capacity', 
      'Facilities', 
      'Status'
    ];
    
    const tableData = lectureHalls.map(hall => [
      hall.hallCode || 'N/A',
      hall.building || 'N/A',
      hall.capacity || 'N/A',
      hall.facilities.join(', ') || 'None',
      hall.status || 'N/A'
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
        0: { cellWidth: 25 }, // Hall Code
        1: { cellWidth: 30 }, // Building
        2: { cellWidth: 20 }, // Capacity
        3: { cellWidth: 60 }, // Facilities
        4: { cellWidth: 25 }  // Status
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
    
    doc.save('Lecture_Hall_Allocation_Report.pdf');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (modalType === 'add') {
      setNewHall(prev => ({ ...prev, [name]: value }));
    } else {
      setSelectedHall(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddFacility = () => {
    if (newFacility.trim() === '') return;
    
    if (modalType === 'add') {
      setNewHall(prev => ({
        ...prev,
        facilities: [...prev.facilities, newFacility]
      }));
    } else {
      setSelectedHall(prev => ({
        ...prev,
        facilities: [...prev.facilities, newFacility]
      }));
    }
    setNewFacility('');
  };

  const handleRemoveFacility = (facility) => {
    if (modalType === 'add') {
      setNewHall(prev => ({
        ...prev,
        facilities: prev.facilities.filter(f => f !== facility)
      }));
    } else {
      setSelectedHall(prev => ({
        ...prev,
        facilities: prev.facilities.filter(f => f !== facility)
      }));
    }
  };

  const handleAddHall = () => {
    setModalType('add');
    setNewHall({
      hallCode: '',
      capacity: '',
      facilities: [],
      building: '',
      status: 'Available'
    });
    setIsModalOpen(true);
  };

  const handleEditHall = (hall) => {
    setModalType('edit');
    setSelectedHall({ ...hall });
    setIsModalOpen(true);
  };

  const handleDeleteHall = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/lecture-halls/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLectureHalls(prev => prev.filter(hall => hall._id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lecture hall');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Prepare the data
      const hallData = {
        hallCode: modalType === 'add' ? newHall.hallCode : selectedHall.hallCode,
        capacity: Number(modalType === 'add' ? newHall.capacity : selectedHall.capacity),
        facilities: modalType === 'add' ? newHall.facilities : selectedHall.facilities,
        building: modalType === 'add' ? newHall.building : selectedHall.building,
        status: modalType === 'add' ? newHall.status : selectedHall.status
      };

      const response = await axios({
        method: modalType === 'add' ? 'post' : 'put',
        url: modalType === 'add' 
          ? 'http://localhost:5000/api/lecture-halls' 
          : `http://localhost:5000/api/lecture-halls/${selectedHall._id}`,
        data: hallData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (modalType === 'add') {
        setLectureHalls(prev => [...prev, response.data]);
      } else {
        setLectureHalls(prev =>
          prev.map(hall => (hall._id === selectedHall._id ? response.data : hall))
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to save lecture hall';
      setError(errorMessage);
    }
  };

  const HallModal = () => (
    <div className="modal-overlay">
      <div className="conflict-modal">
        <div className="modal-header">
          <h3>{modalType === 'add' ? 'Add New Lecture Hall' : 'Edit Lecture Hall'}</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Hall Code</label>
              <input
                type="text"
                name="hallCode"
                value={modalType === 'add' ? newHall.hallCode : selectedHall.hallCode}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={modalType === 'add' ? newHall.capacity : selectedHall.capacity}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Building</label>
              <input
                type="text"
                name="building"
                value={modalType === 'add' ? newHall.building : selectedHall.building}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={modalType === 'add' ? newHall.status : selectedHall.status}
                onChange={handleInputChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Facilities</label>
              <div className="facilities-input">
                <input
                  type="text"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  placeholder="Add facility"
                />
                <button type="button" onClick={handleAddFacility}>+ Add</button>
              </div>
              <div className="facilities-list">
                {(modalType === 'add' ? newHall.facilities : selectedHall.facilities).map((facility, index) => (
                  <div key={index} className="facility-tag">
                    {facility}
                    <button type="button" onClick={() => handleRemoveFacility(facility)}>×</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="submit" className="approve-btn">
                {modalType === 'add' ? 'Add Hall' : 'Save Changes'}
              </button>
              <button type="button" className="reject-btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="dashboard-container"><div className="main-content">Loading lecture halls...</div></div>;

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
              <Link to="/lecture-hall-allocation" style={{ textDecoration: 'none', color: 'inherit' }}>
                Lecture Hall Allocation
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h2 className="h2">Lecture Hall Allocation</h2>
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search lecture halls..." 
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

        {/* Hall Allocation Controls */}
        <div className="timetable-controls">
          <button className="add-btn" onClick={handleAddHall}>
            + Add New Hall
          </button>
          <br></br>
          <button className="pdf-btn" onClick={generatePDF}>
            Generate PDF Report
          </button>
        </div>

        {/* Hall Allocation Table */}
        <div className="conflicts-table">
          {filteredHalls.length === 0 ? (
            <div className="no-results">
              {searchQuery ? `No halls found for "${searchQuery}"` : 'No lecture halls available'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Hall Code</th>
                  <th>Building</th>
                  <th>Capacity</th>
                  <th>Facilities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHalls.map(hall => (
                  <tr key={hall._id}>
                    <td>{hall.hallCode}</td>
                    <td>{hall.building}</td>
                    <td>{hall.capacity}</td>
                    <td>
                      <div className="facilities-list">
                        {hall.facilities.map((facility, index) => (
                          <span key={index} className="facility-tag">{facility}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${hall.status.toLowerCase().replace(' ', '-')}`}>
                        {hall.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditHall(hall)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteHall(hall._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Hall Availability Calendar */}
        <div className="hall-calendar">
          <h3>Hall Availability Calendar</h3>
          <div className="calendar-grid">
            {lectureHalls.map(hall => (
              <div key={hall._id} className="hall-card">
                <div className="hall-header">
                  <h4>{hall.hallCode}</h4>
                  <span className={`status-badge ${hall.status.toLowerCase().replace(' ', '-')}`}>
                    {hall.status}
                  </span>
                </div>
                <div className="hall-details">
                  <p><strong>Building:</strong> {hall.building}</p>
                  <p><strong>Capacity:</strong> {hall.capacity}</p>
                  <p><strong>Facilities:</strong></p>
                  <ul>
                    {hall.facilities.map((facility, index) => (
                      <li key={index}>{facility}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && <HallModal />}
    </div>
  );
};

export default LectureHallAllocation;