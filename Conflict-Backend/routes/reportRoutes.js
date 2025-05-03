// In your server routes (e.g., routes/reportRoutes.js)
const express = require('express');
const router = express.Router();
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');
const path = require('path');
const Course = require('../models/Course'); // Add this import
const Enrollment = require('../models/Enrollment'); // Add this import
const fs = require('fs');



const addLogoToPDF = (doc) => {
    try {
      const logoPath = path.join(__dirname, '../assets/logo-acadamiPlan.png');
      
      // Verify file exists first
      if (!fs.existsSync(logoPath)) {
        console.warn('Logo file not found at:', logoPath);
        return false;
      }
      
      // Get image dimensions
      const imgData = fs.readFileSync(logoPath);
      doc.addImage(imgData, 'PNG', 20, 15, 35, 20);
      return true;
    } catch (err) {
      console.error('Error adding logo:', err);
      return false;
    }
  };


// Course Report
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find(); // Fetch your courses
    
    const doc = new jsPDF();
    
    // Add logo
    const logoAdded = addLogoToPDF(doc);
    
    // Report title and company info
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Course Management Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('AcademiPlan Solutions', 105, 30, { align: 'center' });
    doc.text('Mo 34/60, Wijerama Road, Colombo 07', 105, 35, { align: 'center' });
    doc.text('Phone: 0764456789 | Email: info@academiplan.com', 105, 40, { align: 'center' });
    
    // Date
    const today = new Date();
    doc.text(`Generated on: ${today.toLocaleDateString()}`, 15, 45);
    
    // Table data
    const headers = ['Code', 'Name', 'Instructor', 'Credits', 'Schedule'];
    const tableData = courses.map(course => [
      course.code,
      course.name,
      course.instructor,
      course.credits,
      course.schedule
    ]);
    
    // Add table
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
    
    // Send the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=academiplan-courses-report.pdf');
    res.send(doc.output());
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating report');
  }
});

// Enrollment Report
router.get('/enrollments', async (req, res) => {
    try {
      const enrollments = await Enrollment.find().populate('course');
      
      const doc = new jsPDF();
      
      // Add logo
      const logoAdded = addLogoToPDF(doc);
    
      
      // Report title and company info
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Enrollment Management Report', 105, 20, { align: 'center' });
      
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
        'Enrollment ID', 
        'Course Code', 
        'Course Name', 
        'Student ID', 
        'Enrollment Date'
      ];
      
      const tableData = enrollments.map(enrollment => [
        enrollment._id.toString().substring(18, 24).toUpperCase(),
        enrollment.course?.code || 'N/A',
        enrollment.course?.name || 'N/A',
        enrollment.studentId,
        new Date(enrollment.enrollmentDate).toLocaleDateString()
      ]);
      
      // Add table
      autoTable(doc, {
        startY: 50,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],  // Blue header
          textColor: 255,             // White text
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]  // Light gray alternate rows
        },
        margin: { top: 50 },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          minCellHeight: 8
        },
        columnStyles: {
          0: { cellWidth: 25 },  // Enrollment ID
          1: { cellWidth: 25 },  // Course Code
          2: { cellWidth: 40 },  // Course Name
          3: { cellWidth: 30 },  // Student ID
          4: { cellWidth: 30 }   // Enrollment Date
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
        
        // Add watermark on each page
        doc.setFontSize(60);
        doc.setTextColor(230, 230, 230);
        doc.text('ACADAMIPLAN',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height / 2,
          { align: 'center', angle: 45 }
        );
      }
      
      // Send the PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=academiplan-enrollments-report.pdf');
      res.send(doc.output());
    } catch (error) {
      console.error('Error generating enrollment report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate enrollment report',
        error: error.message
      });
    }
  });

module.exports = router;