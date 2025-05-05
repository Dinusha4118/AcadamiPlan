import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ConflictResolution from './components/ConflictResolution';
import RealTimeNotifications from './components/RealTimeNotifications';
import GenerateReport from './components/GenerateReport';
import emailjs from 'emailjs-com';
import Signup from './components/Auth/Signup';
import Signin from './components/Auth/Signin';
import ProtectedRoute from './components/ProtectedRoute';
import CourseEnrollment from './components/CourseEnrollment/CourseEnrollment';
import WelcomePage from './components/WelcomePage';
import TimetableManagement from './components/TimetableManagement/TimetableManagement';
import UserManagement from './components/UserManagement/UserManagement'; 
import LectureHallAllocation from './components/TimetableManagement/LectureHallAllocation';
import RealTimeAlerts from './components/RealTimeAlerts/RealTimeAlerts';

// Initialize EmailJS
emailjs.init('7LqSR-1n9ia2u4Hau');

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/conflict-resolution" element={<ConflictResolution />} />
          <Route path="/real-time-notifications" element={<RealTimeNotifications />} />
          <Route path="/generate-report" element={<GenerateReport />} />
          <Route path="/course-enrollment" element={<CourseEnrollment />} />
          <Route path="/timetable-management" element={<TimetableManagement />} />
          <Route path="/Lecture-HallAllocation" element={<LectureHallAllocation />} /> 
          <Route path="/generate-report" element={<GenerateReport />} />
          <Route path="/user-management" element={<UserManagement />} /> 
          <Route path="/Real-TimeAlerts" element={<RealTimeAlerts />} /> 
        </Route>
        
        {/* Redirect unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;