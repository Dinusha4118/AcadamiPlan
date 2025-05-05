// backend/services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePDF = async (entries, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add header
      doc.fontSize(20).text('Timetable Report', { align: 'center' });
      doc.fontSize(12).text(`Generated for: ${user.username}`, { align: 'center' });
      doc.moveDown();

      // Add table header
      doc.font('Helvetica-Bold');
      doc.text('Course Code', 50, 150);
      doc.text('Course Name', 150, 150);
      doc.text('Lecturer', 300, 150);
      doc.text('Day/Time', 400, 150);
      doc.text('Lecture Hall', 500, 150);
      doc.moveDown();

      // Add entries
      doc.font('Helvetica');
      let y = 180;
      entries.forEach(entry => {
        doc.text(entry.courseCode, 50, y);
        doc.text(entry.courseName, 150, y);
        doc.text(entry.lecturer, 300, y);
        doc.text(`${entry.day} ${entry.timeSlot}`, 400, y);
        doc.text(entry.lectureHall, 500, y);
        y += 30;
      });

      // Add footer
      doc.fontSize(10).text(
        `Generated on ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePDF };