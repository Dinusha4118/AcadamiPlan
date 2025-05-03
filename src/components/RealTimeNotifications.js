import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import axios from 'axios';
import './Dashboard.css';

const RealTimeNotifications = () => {
  const [activeTab, setActiveTab] = useState('Real Time Notifications');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationType, setNotificationType] = useState('Schedule Change');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [user, setUser] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [notificationMethod, setNotificationMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [lecturerOptions, setLecturerOptions] = useState([]);
  const [mobileOptions, setMobileOptions] = useState([]);
  const [emailOptions, setEmailOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/signin');
      return;
    }
    setUser(userData);

    // Fetch lecturers
    const fetchLecturers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users', {
          params: { accountType: 'Lecturer' }
        });
        setLecturers(response.data.users || []);
        
        // Set dropdown options with unique keys
        setLecturerOptions(response.data.users.map(lecturer => ({
          value: lecturer._id,
          label: lecturer.username
        })));

        // Add username to mobile options to ensure uniqueness
        setMobileOptions(response.data.users.map(lecturer => ({
          value: lecturer.mobile,
          label: `${lecturer.mobile} (${lecturer.username})`,
          originalMobile: lecturer.mobile // Store original for comparison
        })));

        setEmailOptions(response.data.users.map(lecturer => ({
          value: lecturer.email,
          label: lecturer.email
        })));

      } catch (err) {
        console.error('Error fetching lecturers:', err);
      }
    };

    fetchLecturers();
    emailjs.init('7LqSR-1n9ia2u4Hau');
  }, [navigate]);

  const handleLecturerSelect = (e) => {
    const lecturerId = e.target.value;
    setSelectedLecturer(lecturerId);
    
    if (lecturerId) {
      const selected = lecturers.find(l => l._id === lecturerId);
      if (selected) {
        setEmail(selected.email);
        setMobile(selected.mobile);
      }
    } else {
      setEmail('');
      setMobile('');
    }
  };

  const handleMobileSelect = (e) => {
    const selectedValue = e.target.value;
    const selectedOption = mobileOptions.find(opt => opt.value === selectedValue);
    
    if (selectedOption) {
      setMobile(selectedOption.originalMobile); // Use the original mobile number
      
      // Find and set the corresponding lecturer
      const selectedLecturer = lecturers.find(l => l.mobile === selectedOption.originalMobile);
      if (selectedLecturer) {
        setSelectedLecturer(selectedLecturer._id);
        setEmail(selectedLecturer.email);
      }
    } else {
      setMobile('');
    }
  };

  const handleEmailSelect = (e) => {
    const emailAddr = e.target.value;
    setEmail(emailAddr);
    
    if (emailAddr) {
      const selected = lecturers.find(l => l.email === emailAddr);
      if (selected) {
        setSelectedLecturer(selected._id);
        setMobile(selected.mobile);
      }
    }
  };

  const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateMobile = (mobile) => {
    return /^0\d{9}$/.test(mobile);
  };

  const validateDescription = (text) => {
    if (text.trim().length < 10) {
      setDescriptionError('Description must be at least 10 characters');
      return false;
    }
    setDescriptionError('');
    return true;
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSmsError('');

    // Validate inputs
    let isValid = true;

    if (!validateDescription(description)) {
      isValid = false;
    }

    if (notificationMethod === 'email' || notificationMethod === 'both') {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      } else {
        setEmailError('');
      }
    }

    if (notificationMethod === 'sms' || notificationMethod === 'both') {
      if (!validateMobile(mobile)) {
        setMobileError('Mobile must be 10 digits starting with 0');
        isValid = false;
      } else {
        setMobileError('');
      }
    }

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      // Send email if selected
      if (notificationMethod === 'email' || notificationMethod === 'both') {
        await emailjs.send(
          'service_m83037r',
          'template_6gp5wcr',
          {
            email: email,
            from_name: user?.username || 'AcademiPlan',
            type: notificationType,
            title: notificationTitle,
            Description: description,
            message: `Notification Type: ${notificationType}\nTitle: ${notificationTitle}\nDescription: ${description}`,
            reply_to: 'dinushadeshan5@gmail.com'
          },
          '7LqSR-1n9ia2u4Hau'
        );
      }

      // Send SMS if selected
      if (notificationMethod === 'sms' || notificationMethod === 'both') {
        try {
          const response = await axios.post('http://localhost:5000/api/send-sms', {
            mobile,
            message: `${notificationType}: ${notificationTitle}\n${description}`
          });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to send SMS');
          }
        } catch (err) {
          setSmsError(err.response?.data?.message || err.message || 'Failed to send SMS');
          throw err;
        }
      }

      alert('Notification sent successfully!');
      setNotificationTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to send notification:', err);
      if (!smsError) {
        alert('Failed to send notification. ' + (err.message || 'Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobile(value);
      if (value.length === 10) {
        setMobileError('');
      } else {
        setMobileError('Mobile must be exactly 10 digits');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="dashboard-container">
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
            {['Dashboard', 'Conflict Resolution', 'Real Time Notifications', 'Course Enrollment','User Management'].map((item) => (
              <li 
                key={item} 
                className={activeTab === item ? 'active' : ''}
                onClick={() => setActiveTab(item)}
              >
                <Link to={`/${item.toLowerCase().replace(/\s+/g, '-').trim()}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="main-content">
        <header className="header">
          <h2 className="h2">Real Time Notifications</h2>
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
        
        <div className="notification-content">
          <section className="notification-section">
            <h3>Send Notifications</h3>
            
            {/* Lecturer Selection */}
            <div className="form-group">
              <label>Select Lecturer by Username</label>
              <select
                value={selectedLecturer}
                onChange={handleLecturerSelect}
              >
                <option value="">-- Select Lecturer --</option>
                {lecturerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Selection */}
            <div className="form-group">
            <label>Or Select by Mobile Number</label>
            <select
              value={mobileOptions.find(opt => opt.originalMobile === mobile)?.value || ''}
              onChange={handleMobileSelect}
            >
              <option value="">-- Select Mobile --</option>
              {mobileOptions.map(option => (
                <option key={`${option.value}-${option.label}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>


            {/* Email Selection */}
            <div className="form-group">
              <label>Or Select by Email</label>
              <select
                value={email}
                onChange={handleEmailSelect}
              >
                <option value="">-- Select Email --</option>
                {emailOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Method */}
            <div className="form-group">
              <label>Notification Method</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="email"
                    checked={notificationMethod === 'email'}
                    onChange={() => setNotificationMethod('email')}
                  />
                  Email Only
                </label>
                <label>
                  <input
                    type="radio"
                    value="sms"
                    checked={notificationMethod === 'sms'}
                    onChange={() => setNotificationMethod('sms')}
                  />
                  SMS Only
                </label>
                <label>
                  <input
                    type="radio"
                    value="both"
                    checked={notificationMethod === 'both'}
                    onChange={() => setNotificationMethod('both')}
                  />
                  Both
                </label>
              </div>
            </div>

            {/* Email Input (shown for email or both) */}
            {(notificationMethod === 'email' || notificationMethod === 'both') && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="Enter recipient email"
                  className={emailError ? 'error' : ''}
                />
                {emailError && <span className="error-message">{emailError}</span>}
              </div>
            )}

            {/* Mobile Input (shown for sms or both) */}
            {(notificationMethod === 'sms' || notificationMethod === 'both') && (
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={handleMobileChange}
                  placeholder="Enter recipient mobile number"
                  maxLength={10}
                  className={mobileError ? 'error' : ''}
                />
                {mobileError && <span className="error-message">{mobileError}</span>}
              </div>
            )}

            {/* Notification Details */}
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter notification title"
                required
              />
            </div>

            <div className="form-group">
              <label>Type Selection</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
              >
                <option value="Schedule Change">Schedule Change</option>
                <option value="Room Change">Room Change</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  validateDescription(e.target.value);
                }}
                placeholder="Enter detailed description (minimum 10 characters)"
                className={descriptionError ? 'error' : ''}
                rows={5}
                required
              />
              {descriptionError && (
                <span className="error-message">{descriptionError}</span>
              )}
            </div>
            {smsError && (
              <div className="error-message" style={{ marginTop: '10px' }}>
                SMS Error: {smsError}
              </div>
            )}

            <button 
              type="button" 
              onClick={handleSendNotification}
              className="send-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNotifications;