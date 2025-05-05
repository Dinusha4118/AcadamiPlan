import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CourseEnrollment.css';

const CourseEnrollment = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    courseId: '',
    studentId: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    instructor: '',
    credits: 3,
    schedule: ''
  });
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fetch data and user info
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/signin');
      return;
    }
    setUser(userData);
    
    fetchCourses();
    fetchEnrollments();
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/courses');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/enrollments');
      setEnrollments(response.data);
    } catch (err) {
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const createCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/courses', courseForm);
      fetchCourses();
      setCourseForm({
        code: '',
        name: '',
        instructor: '',
        credits: 3,
        schedule: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const enrollStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/enrollments', formData);
      fetchEnrollments();
      setFormData({
        ...formData,
        studentId: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  const deleteCourse = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`);
      fetchCourses();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const deleteEnrollment = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/enrollments/${id}`);
      fetchEnrollments();
    } catch (err) {
      setError('Failed to delete enrollment');
    }
  };

  // Edit Operations
  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditData({...item});
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/courses/${editingId}`, editData);
      fetchCourses();
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter data based on search
  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.course?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.course?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      // Create new jsPDF instance
      const doc = new jsPDF();
      
      // Report title and company info
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(`${activeTab === 'courses' ? 'Course' : 'Enrollment'} Report`, 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('AcademiPlan Solutions', 105, 30, { align: 'center' });
      doc.text('Mo 34/60, Wijerama Road, Colombo 07', 105, 35, { align: 'center' });
      doc.text('Phone: 0764456789 | Email: info@academiplan.com', 105, 40, { align: 'center' });
      
      // Date
      const today = new Date();
      doc.text(`Generated on: ${today.toLocaleDateString()}`, 15, 45);
      
      // Try to add logo with error handling
      try {
        const logoUrl = require('../../assets/logo-acadamiPlan.png');
        doc.addImage(logoUrl, 'PNG', 20, 15, 35, 20);
      } catch (err) {
        console.warn('Could not load logo image', err);
      }
      
      if (activeTab === 'courses') {
        if (filteredCourses.length === 0) {
          doc.text('No course data available', 15, 60);
        } else {
          // Course report table
          autoTable(doc, {
            startY: 60,
            head: [['Code', 'Course Name', 'Instructor', 'Credits', 'Schedule']],
            body: filteredCourses.map(course => [
              course.code,
              course.name,
              course.instructor,
              course.credits,
              course.schedule
            ]),
            theme: 'grid',
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak'
            },
            columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 50 },
              2: { cellWidth: 40 },
              3: { cellWidth: 15 },
              4: { cellWidth: 40 }
            }
          });
        }
      } else {
        if (filteredEnrollments.length === 0) {
          doc.text('No enrollment data available', 15, 60);
        } else {
          // Enrollment report table
          autoTable(doc, {
            startY: 60,
            head: [['Enrollment ID', 'Course Code', 'Course Name', 'Student ID', 'Enrollment Date']],
            body: filteredEnrollments.map(enrollment => [
              enrollment._id.substring(18, 24).toUpperCase(),
              enrollment.course?.code || 'N/A',
              enrollment.course?.name || 'N/A',
              enrollment.studentId,
              new Date(enrollment.enrollmentDate).toLocaleDateString()
            ]),
            theme: 'grid',
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak'
            },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 25 },
              2: { cellWidth: 50 },
              3: { cellWidth: 30 },
              4: { cellWidth: 30 }
            }
          });
        }
      }
      
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
      
      // Save the PDF
      doc.save(`${activeTab === 'courses' ? 'Course' : 'Enrollment'}_Report.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF report. Please check console for details.');
    } finally {
      setPdfLoading(false);
    }
  };
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
            {['Course Management', 'Enrollment System'].map((item) => (
              <li 
                key={item} 
                className={activeTab.toLowerCase().includes(item.split(' ')[0].toLowerCase()) ? 'active' : ''}
                onClick={() => setActiveTab(item.split(' ')[0].toLowerCase() + 's')}
              >
                <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>
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
          <h2 className="h2">{activeTab === 'courses' ? 'Course Management' : 'Enrollment System'}</h2>
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Type here to search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="user-info">
            <button className="signout-btn" onClick={handleSignOut}>
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
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Sections */}
        <div className="content-section">
          {/* Error Display */}
          {error && <div className="error-message">{error}</div>}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <>
              {/* Add Course Form */}
              <div className="form-card">
                <h3>Add New Course</h3>
                <form onSubmit={createCourse}>
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      type="text"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Name</label>
                    <input
                      type="text"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructor</label>
                    <input
                      type="text"
                      value={courseForm.instructor}
                      onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Schedule</label>
                    <input
                      type="text"
                      value={courseForm.schedule}
                      onChange={(e) => setCourseForm({...courseForm, schedule: e.target.value})}
                      placeholder="Day Time Room"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Add Course
                  </button>
                </form>
              </div>

              {/* Courses Table */}
              <div className="table-container">
                <button 
                  className="pdf-btn" 
                  onClick={generatePDF}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    'Generating...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate PDF Report
                    </>
                  )}
                </button>
                {filteredCourses.length === 0 ? (
                  <div className="no-results">
                    {searchQuery ? `No courses found for "${searchQuery}"` : 'No courses available'}
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Instructor</th>
                        <th>Credits</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course._id}>
                          <td>
                            {editingId === course._id ? (
                              <input
                                type="text"
                                name="code"
                                value={editData.code}
                                onChange={handleEditChange}
                                required
                              />
                            ) : (
                              course.code
                            )}
                          </td>
                          <td>
                            {editingId === course._id ? (
                              <input
                                type="text"
                                name="name"
                                value={editData.name}
                                onChange={handleEditChange}
                                required
                              />
                            ) : (
                              course.name
                            )}
                          </td>
                          <td>
                            {editingId === course._id ? (
                              <input
                                type="text"
                                name="instructor"
                                value={editData.instructor}
                                onChange={handleEditChange}
                                required
                              />
                            ) : (
                              course.instructor
                            )}
                          </td>
                          <td>
                            {editingId === course._id ? (
                              <input
                                type="number"
                                name="credits"
                                min="1"
                                max="6"
                                value={editData.credits}
                                onChange={handleEditChange}
                                required
                              />
                            ) : (
                              course.credits
                            )}
                          </td>
                          <td>
                            {editingId === course._id ? (
                              <input
                                type="text"
                                name="schedule"
                                value={editData.schedule}
                                onChange={handleEditChange}
                                required
                              />
                            ) : (
                              course.schedule
                            )}
                          </td>
                          <td>
                            {editingId === course._id ? (
                              <>
                                <button className="save-btn" onClick={handleSave}>
                                  💾 Save
                                </button>
                                <button className="cancel-btn" onClick={handleCancel}>
                                  ❌ Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="edit-btn"
                                  onClick={() => handleEdit(course)}
                                >
                                  ✏️ Edit
                                </button>
                                <button 
                                  className="delete-btn"
                                  onClick={() => deleteCourse(course._id)}
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <>
              {/* Enrollment Form */}
              <div className="form-card">
                <h3>Enroll Student</h3>
                <form onSubmit={enrollStudent}>
                  <div className="form-group">
                    <label>Course</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Student ID</label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Enrollment Date</label>
                    <input
                      type="date"
                      value={formData.enrollmentDate}
                      onChange={(e) => setFormData({...formData, enrollmentDate: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Enroll Student
                  </button>
                </form>
              </div>

              {/* Enrollments Table */}
              <div className="table-container">
                <button 
                  className="pdf-btn" 
                  onClick={generatePDF}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    'Generating...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate PDF Report
                    </>
                  )}
                </button>
                {filteredEnrollments.length === 0 ? (
                  <div className="no-results">
                    {searchQuery ? `No enrollments found for "${searchQuery}"` : 'No enrollments available'}
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Enrollment ID</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Student ID</th>
                        <th>Enrollment Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((enrollment) => (
                        <tr key={enrollment._id}>
                          <td>{enrollment._id.substring(18, 24).toUpperCase()}</td>
                          <td>{enrollment.course?.code}</td>
                          <td>{enrollment.course?.name}</td>
                          <td>{enrollment.studentId}</td>
                          <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="delete-btn"
                              onClick={() => deleteEnrollment(enrollment._id)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollment;