import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import io from 'socket.io-client';
import '../Dashboard.css';
import { Link } from 'react-router-dom';
import TimetableCalendar from '../TimetableCalendar';


// Connect to Socket.IO server
const socket = io('http://localhost:5000');



const RealTimeAlerts = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('notifications'); // 'notifications' or 'calendar'
  const [activeTab, setActiveTab] = useState('Real Time Notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmergencyRelocation, setShowEmergencyRelocation] = useState(false);
  const [relocationOptions, setRelocationOptions] = useState([]);
  const [selectedEntryForRelocation, setSelectedEntryForRelocation] = useState(null);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          navigate('/signin');
          return;
        }
        setUser(userData);

        const response = await axios.get('http://localhost:5000/api/timetable/notifications');
        setNotifications(response.data);
        setFilteredNotifications(response.data);
        
        // Count unread notifications
        const unread = response.data.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch notifications');
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up Socket.IO listener for new notifications
    socket.on('newNotification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setFilteredNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if user is not on the notifications page
      if (window.location.pathname !== 'http://localhost:5000/real-time-notifications') {
        showBrowserNotification(newNotification);
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, [navigate]);

  // Filter notifications based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotifications(notifications);
      return;
    }

    const filtered = notifications.filter(notification => {
      const query = searchQuery.toLowerCase();
      return (
        notification.message.toLowerCase().includes(query) ||
        (notification.relatedEntry?.courseCode?.toLowerCase().includes(query)) ||
        (notification.relatedEntry?.courseName?.toLowerCase().includes(query)) ||
        notification.type.toLowerCase().includes(query)
      );
    });

    setFilteredNotifications(filtered);
  }, [searchQuery, notifications]);

  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('New Timetable Alert', {
        body: notification.message,
        icon: '/logo192.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('New Timetable Alert', {
            body: notification.message,
            icon: '/logo192.png'
          });
        }
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/timetable/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      
      setFilteredNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Mark as read error:', err);
      setError(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => n.status === 'unread')
          .map(n => 
            axios.put(`http://localhost:5000/api/timetable/notifications/${n._id}/read`)
          )
      );
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      
      setFilteredNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
      setError(err.response?.data?.message || 'Failed to mark notifications as read');
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Add logo
    const logoUrl = require('../../assets/logo-acadamiPlan.png');
    doc.addImage(logoUrl, 'PNG', 20, 15, 35, 20);
    
    // Report title and company info
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Timetable Change Alerts Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('AcademiPlan Solutions', 105, 30, { align: 'center' });
    doc.text('Mo 34/60, Wijerama Road, Colombo 07', 105, 35, { align: 'center' });
    doc.text('Phone: 0764456789 | Email: info@academiplan.com', 105, 40, { align: 'center' });
    
    // Date
    const today = new Date();
    doc.text(`Generated on: ${today.toLocaleDateString()}`, 15, 45);
    
    // Table data
    const headers = ['Type', 'Message', 'Related Course', 'Status', 'Date'];
    
    const tableData = filteredNotifications.map(notification => [
      notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
      notification.message,
      notification.relatedEntry?.courseCode || 'N/A',
      notification.status === 'read' ? 'Read' : 'Unread',
      new Date(notification.createdAt).toLocaleString()
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
        0: { cellWidth: 20 }, // Type
        1: { cellWidth: 70 }, // Message
        2: { cellWidth: 25 }, // Related Course
        3: { cellWidth: 15 }, // Status
        4: { cellWidth: 30 }  // Date
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
    
    doc.save('Timetable_Alerts_Report.pdf');
  };

  const exportAsPNG = () => {
    const element = document.getElementById('notifications-table');
    
    html2canvas(element).then(canvas => {
      const link = document.createElement('a');
      link.download = 'timetable-alerts.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    
    // Mark as read when viewing details
    if (notification.status === 'unread') {
      markAsRead(notification._id);
    }
  };

  const handleEmergencyRelocation = async (entry) => {
    try {
      setSelectedEntryForRelocation(entry);
      
      const response = await axios.get('http://localhost:5000/api/timetable/emergency-relocation', {
        params: {
          day: entry.day,
          timeSlot: entry.timeSlot,
          currentHall: entry.lectureHall
        }
      });
      
      setRelocationOptions(response.data);
      setShowEmergencyRelocation(true);
    } catch (err) {
      console.error('Error getting relocation options:', err);
      setError(err.response?.data?.message || 'Failed to get relocation options');
    }
  };

  const performRelocation = async (hallCode) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/timetable/auto-relocate/${selectedEntryForRelocation._id}`,
        { hallCode }
      );
      
      alert('Class relocated successfully!');
      setShowEmergencyRelocation(false);
      
      // Update notifications
      const updatedNotifications = [response.data.notification, ...notifications];
      setNotifications(updatedNotifications);
      setFilteredNotifications(updatedNotifications);
    } catch (err) {
      console.error('Relocation error:', err);
      setError(err.response?.data?.message || 'Failed to relocate class');
    }
  };

  const NotificationDetailsModal = () => (
    <div className="modal-overlay">
      <div className="notification-modal">
        <div className="modal-header">
          <h3>Notification Details</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="detail-section">
            <h4>Notification Information</h4>
            <p><strong>Type:</strong> 
              <span className={`type-badge ${selectedNotification?.type}`}>
                {selectedNotification?.type}
              </span>
            </p>
            <p><strong>Message:</strong> {selectedNotification?.message}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge ${selectedNotification?.status}`}>
                {selectedNotification?.status}
              </span>
            </p>
            <p><strong>Date:</strong> {new Date(selectedNotification?.createdAt).toLocaleString()}</p>
          </div>

          {selectedNotification?.relatedEntry && (
            <div className="detail-section">
              <h4>Related Course</h4>
              <p><strong>Course Code:</strong> {selectedNotification.relatedEntry.courseCode}</p>
              <p><strong>Course Name:</strong> {selectedNotification.relatedEntry.courseName}</p>
              <p><strong>Lecturer:</strong> {selectedNotification.relatedEntry.lecturer}</p>
              <p><strong>Time Slot:</strong> {selectedNotification.relatedEntry.timeSlot}</p>
              <p><strong>Lecture Hall:</strong> {selectedNotification.relatedEntry.lectureHall}</p>
              
              {selectedNotification.type === 'relocation' && (
                <button 
                  className="emergency-btn"
                  onClick={() => handleEmergencyRelocation(selectedNotification.relatedEntry)}
                >
                  Emergency Relocation Options
                </button>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const RelocationModal = () => (
    <div className="modal-overlay">
      <div className="relocation-modal">
        <div className="modal-header">
          <h3>Emergency Relocation Options</h3>
          <button className="close-btn" onClick={() => setShowEmergencyRelocation(false)}>×</button>
        </div>
        
        <div className="modal-content">
          <h4>Available Lecture Halls for {selectedEntryForRelocation?.courseCode} at {selectedEntryForRelocation?.timeSlot}</h4>
          
          {relocationOptions.length === 0 ? (
            <p>No available lecture halls found for this time slot.</p>
          ) : (
            <div className="hall-options">
              {relocationOptions.map(hall => (
                <div key={hall._id} className="hall-option">
                  <h5>{hall.hallCode}</h5>
                  <p>Capacity: {hall.capacity}</p>
                  <p>Building: {hall.building}</p>
                  <p>Facilities: {hall.facilities.join(', ')}</p>
                  <button 
                    className="select-hall-btn"
                    onClick={() => performRelocation(hall.hallCode)}
                  >
                    Select This Hall
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="dashboard-container">Loading notifications...</div>;
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
            src={require('../../assets/compani-logo1.png')} 
            alt="AcademiPlan Logo" 
            className="logo-image"
          />
        </div>
        <nav>
          <ul>
            {['Dashboard', 'Conflict Resolution', 'Real Time Notifications', 'Course Enrollment', 'User Management'].map((item) => (
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
          <h2 className="h2">Real-Time Timetable Alerts</h2>
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="user-info">
            <div className="notification-badge" data-count={unreadCount}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
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

        <div className="action-buttons">
          <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark All as Read
          </button>
          <button className="pdf-btn" onClick={generatePDFReport}>
            Export as PDF
          </button>
          <button className="png-btn" onClick={exportAsPNG}>
            Export as PNG
          </button>
          <button 
             className={`view-toggle-btn ${view === 'notifications' ? 'active' : ''}`}
             onClick={() => setView('notifications')}
           >
             Notifications
           </button>
             <button 
                 className={`view-toggle-btn ${view === 'calendar' ? 'active' : ''}`}
                 onClick={() => setView('calendar')}
              >
           Calendar View
           </button>
        </div>

        {/* Notifications Table */}
        <div className="notifications-table" id="notifications-table">
          {filteredNotifications.length === 0 ? (
            <div className="no-results">
              {searchQuery ? `No notifications found for "${searchQuery}"` : 'No notifications available'}
            </div>
          ) : (
            <div className="calendar-view">
                 <TimetableCalendar />
           </div>
          )}
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Related Course</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr 
                    key={notification._id} 
                    className={notification.status === 'unread' ? 'unread' : ''}
                  >
                    <td>
                      <span className={`type-badge ${notification.type}`}>
                        {notification.type}
                      </span>
                    </td>
                    <td>{notification.message}</td>
                    <td>
                      {notification.relatedEntry?.courseCode || 'N/A'}
                      {notification.relatedEntry?.courseName && (
                        <small>{notification.relatedEntry.courseName}</small>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${notification.status}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td>{new Date(notification.createdAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="details-btn"
                        onClick={() => handleViewDetails(notification)}
                      >
                        View Details
                      </button>
                      {notification.status === 'unread' && (
                        <button 
                          className="mark-read-btn"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <NotificationDetailsModal />}
      {showEmergencyRelocation && <RelocationModal />}
    </div>
  );
};

export default RealTimeAlerts;