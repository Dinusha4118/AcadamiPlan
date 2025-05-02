import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      {/* Header with Auth Buttons */}
      <header className="welcome-header">
        <div className="auth-buttons">
          <button className="auth-btn signin-btn" onClick={() => navigate('/signin')}>
            Sign In
          </button>
          <button className="auth-btn signup-btn" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="welcome-main">
        <div className="hero-content">
          <h1 className="app-name">AcadamiPlan</h1>
          <p className="app-description">
            Your all-in-one academic management solution for seamless course planning, 
            conflict resolution, and progress tracking.
          </p>
          <button className="get-started-btn" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="decorative-elements">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>

        {/* Feature Highlights */}
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Dashboard Analytics</h3>
            <p>Track your academic progress with beautiful visualizations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Conflict Resolution</h3>
            <p>Easily manage and resolve scheduling conflicts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Real-time Alerts</h3>
            <p>Get instant notifications about important updates</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;