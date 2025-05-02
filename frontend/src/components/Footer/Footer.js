// src/components/Footer/Footer.js
import React from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section about">
          <h3 className="footer-logo">AcadamiPlan</h3>
          <p className="footer-text">
            Your comprehensive academic planning solution for universities and educational institutions.
          </p>
          <div className="footer-contact">
            <span className="contact-item">
              <i className="fas fa-map-marker-alt"></i> No 34/80, Salmal Uyana, Colombo 07
            </span>
            <span className="contact-item">
              <i className="fas fa-phone"></i> 0785559994
            </span>
          </div>
        </div>

        <div className="footer-section social">
          <h3>Connect With Us</h3>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook className="icon" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter className="icon" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram className="icon" />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} AcadamiPlan | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;