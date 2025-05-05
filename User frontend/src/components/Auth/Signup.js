import React, { useState } from 'react';
import './Auth.css';
import countryCodes from './countryCodes';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    idNumber: '',
    email: '',
    mobileCode: '+94',
    mobileNumber: '',
    password: '',
    accountType: 'Student', // Default account type
    profilePhoto: null,
    previewPhoto: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    idNumber: '',
    email: '',
    mobileNumber: '',
    password: '',
    profilePhoto: ''
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: '',
      idNumber: '',
      email: '',
      mobileNumber: '',
      password: '',
      profilePhoto: ''
    };

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      valid = false;
    }

    // ID Number validation
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
      valid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    // Mobile number validation - exactly 10 digits
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
      valid = false;
    } else if (!/^\d+$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must contain only digits';
      valid = false;
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    // Profile photo validation (optional)
    if (formData.profilePhoto && formData.profilePhoto.size > 2 * 1024 * 1024) {
      newErrors.profilePhoto = 'Image size should be less than 2MB';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For mobile number, only allow digits and limit to 10 characters
    if (name === 'mobileNumber') {
      if ((value === '' || /^\d+$/.test(value)) && value.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setErrors(prev => ({
          ...prev,
          profilePhoto: 'Please select an image file'
        }));
        return;
      }
      
      // Validate file size
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({
          ...prev,
          profilePhoto: 'Image size should be less than 2MB'
        }));
        return;
      }
      
      // Clear any previous errors
      setErrors(prev => ({
        ...prev,
        profilePhoto: ''
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePhoto: file,
          previewPhoto: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('mobile', formData.mobileNumber); // Just the number without code
      formDataToSend.append('password', formData.password);
      formDataToSend.append('accountType', formData.accountType);
      
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }
  
      const response = await axios.post('http://localhost:5000/api/auth/signup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.success) {
        navigate('/signin', { state: { signupSuccess: true } });
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        setErrors(prev => ({
          ...prev,
          server: err.response.data.message || 
                  err.response.data.error || 
                  'Signup failed. Please try again.',
          ...(err.response.data.errors
            ? Object.fromEntries(
                Object.entries(err.response.data.errors).map(([key, value]) => 
                  [key.toLowerCase(), value]
                )
              )
            : {})
        }));
        
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setErrors(prev => ({
          ...prev,
          server: 'No response from server. Please check your connection.'
        }));
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', err.message);
        setErrors(prev => ({
          ...prev,
          server: 'Error setting up request. Please try again.'
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        {errors.server && <div className="error-message">{errors.server}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Type</label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="account-type-select"
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Administrative">Administrative</option>
            </select>
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <div className="profile-upload">
              {formData.previewPhoto ? (
                <img src={formData.previewPhoto} alt="Preview" className="profile-preview" />
              ) : (
                <div className="profile-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
              <label htmlFor="profilePhoto" className="upload-btn">
                Choose Photo
              </label>
              {errors.profilePhoto && <div className="error-text">{errors.profilePhoto}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {errors.username && <div className="error-text">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label>ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
            />
            {errors.idNumber && <div className="error-text">{errors.idNumber}</div>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div className="mobile-input">
              <select
                name="mobileCode"
                value={formData.mobileCode}
                onChange={handleChange}
                className="country-code"
              >
                {countryCodes.map((code) => (
                  <option key={code.code} value={code.dial_code}>
                    {code.flag} {code.name} ({code.dial_code})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                pattern="\d{10}"
                maxLength="10"
                title="Please enter exactly 10 digits"
              />
            </div>
            {errors.mobileNumber && <div className="error-text">{errors.mobileNumber}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <a href="/signin">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;