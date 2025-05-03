import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../Dashboard.css';

const localizer = momentLocalizer(moment);

const RealTimeAlerts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('Updated Timetable');
  const [emailMessage, setEmailMessage] = useState('Please find attached the latest timetable.');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          navigate('/signin');
          return;
        }
        setUser(userData);

        const [timetableRes, conflictsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/timetable'),
          axios.get('http://localhost:5000/api/timetable/conflicts')
        ]);

        setTimetable(timetableRes.data);
        setConflicts(conflictsRes.data);
        prepareCalendarEvents(timetableRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const prepareCalendarEvents = (timetableData) => {
    const events = timetableData.map(entry => ({
      id: entry._id,
      title: `${entry.courseCode} - ${entry.lectureHall}`,
      start: new Date(`${moment().format('YYYY-MM-DD')}T${entry.timeSlot.split('-')[0]}:00`),
      end: new Date(`${moment().format('YYYY-MM-DD')}T${entry.timeSlot.split('-')[1]}:00`),
      resource: {
        lecturer: entry.lecturer,
        isConflict: entry.isConflict
      }
    }));
    setCalendarEvents(events);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/timetable/${id}`);
      setTimetable(timetable.filter(item => item._id !== id));
      prepareCalendarEvents(timetable.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleEdit = async (item) => {
    const updatedData = {
      courseCode: prompt('Course Code:', item.courseCode) || item.courseCode,
      courseName: prompt('Course Name:', item.courseName) || item.courseName,
      lecturer: prompt('Lecturer:', item.lecturer) || item.lecturer,
      day: prompt('Day:', item.day) || item.day,
      timeSlot: prompt('Time Slot:', item.timeSlot) || item.timeSlot,
      lectureHall: prompt('Lecture Hall:', item.lectureHall) || item.lectureHall
    };

    try {
      await axios.put(`http://localhost:5000/api/timetable/${item._id}`, updatedData);
      const response = await axios.get('http://localhost:5000/api/timetable');
      setTimetable(response.data);
      prepareCalendarEvents(response.data);
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const generateTimetablePDF = () => {
    const doc = new jsPDF();
    doc.text('Timetable Report', 10, 10);
    autoTable(doc, {
      head: [['Course', 'Code', 'Lecturer', 'Day', 'Time', 'Hall']],
      body: timetable.map(item => [
        item.courseName,
        item.courseCode,
        item.lecturer,
        item.day,
        item.timeSlot,
        item.lectureHall
      ])
    });
    doc.save('timetable.pdf');
  };

  const sendTimetableEmail = async () => {
    try {
      const pdfDoc = new jsPDF();
      pdfDoc.text('Timetable Report', 10, 10);
      autoTable(pdfDoc, {
        head: [['Course', 'Code', 'Lecturer', 'Day', 'Time', 'Hall']],
        body: timetable.map(item => [
          item.courseName,
          item.courseCode,
          item.lecturer,
          item.day,
          item.timeSlot,
          item.lectureHall
        ])
      });
      const pdfData = pdfDoc.output('blob');

      const formData = new FormData();
      formData.append('pdf', pdfData, 'timetable.pdf');
      formData.append('recipients', emailRecipients);
      formData.append('subject', emailSubject);
      formData.append('message', emailMessage);

      await axios.post('http://localhost:5000/api/timetable/send-timetable-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Timetable email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send timetable email');
    }
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.resource.isConflict ? '#ff6b6b' : '#51cf66',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px'
    }
  });

  if (isLoading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar - Keep as is */}
      <div className="sidebar">
        <div className="logo">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            className="logo-image"
          />
        </div>
        <nav>
          <ul>
            <li className="active">Timetable</li>
            {/* Add other navigation items as needed */}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h2 className="h2">Timetable Management</h2>
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search timetable..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="user-info">
            <button className="signout-btn" onClick={() => {
              localStorage.removeItem('user');
              navigate('/signin');
            }}>
              Signout
            </button>
            <div className="profile-pic">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="greeting">Hello {user?.username}</span>
              <span className="user-role">{user?.accountType}</span>
            </div>
          </div>
        </header>

        {/* Timetable Actions */}
        <div className="timetable-actions">
          <button className="action-btn" onClick={generateTimetablePDF}>
            Generate PDF
          </button>
          <button 
            className="action-btn email-btn" 
            onClick={() => document.getElementById('emailModal').style.display = 'block'}
          >
            Email Timetable
          </button>
        </div>

        {/* Conflict Alert */}
        {conflicts.length > 0 && (
          <div className="conflict-alert">
            <h3>⚠️ {conflicts.length} Conflict(s) Detected</h3>
            <p>Please resolve the scheduling conflicts in the timetable.</p>
          </div>
        )}

        {/* Timetable Calendar */}
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventStyleGetter}
            defaultView="week"
            views={['week', 'day']}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 18, 0, 0)}
          />
        </div>

        {/* Timetable Table */}
        <div className="timetable-table">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Code</th>
                <th>Lecturer</th>
                <th>Day</th>
                <th>Time</th>
                <th>Hall</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetable
                .filter(item => 
                  item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.lecturer.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(item => (
                  <tr key={item._id} className={item.isConflict ? 'conflict-row' : ''}>
                    <td>{item.courseName}</td>
                    <td>{item.courseCode}</td>
                    <td>{item.lecturer}</td>
                    <td>{item.day}</td>
                    <td>{item.timeSlot}</td>
                    <td>{item.lectureHall}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Email Modal */}
        <div id="emailModal" className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Email Timetable</h3>
              <button 
                className="close-btn" 
                onClick={() => document.getElementById('emailModal').style.display = 'none'}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Recipients (comma separated)</label>
                <input 
                  type="text" 
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button className="send-btn" onClick={sendTimetableEmail}>
                  Send Email
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => document.getElementById('emailModal').style.display = 'none'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAlerts;