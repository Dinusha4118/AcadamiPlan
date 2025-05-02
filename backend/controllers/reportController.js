const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');

exports.generateCoursesReport = async (req, res) => {
  try {
    const courses = await Course.find().sort({ code: 1 });
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=courses-report.pdf');

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add logo (make sure you have a logo.png in your backend/assets folder)
    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 50 });
    }

    // Header Information
    doc
      .fontSize(20)
      .text('ACADEMIPLAN COURSES REPORT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text('123 Education Street, Knowledge City', { align: 'center' })
      .text('Phone: +1 (555) 123-4567 | Email: info@academiplan.com', { align: 'center' })
      .moveDown(1);

    // Print Date on Right
    doc
      .fontSize(10)
      .text(`Printed: ${new Date().toLocaleDateString()}`, { align: 'right' })
      .moveDown(2);

    // Report Title
   
    // Table Header
    doc.font('Helvetica-Bold');
    generateTableRow(doc, 150, ['Code', 'Name', 'Instructor', 'Credits', 'Schedule'], true);
    doc.font('Helvetica');

    // Table Content
    let y = 180; // Initial vertical position for the table content
    courses.forEach((course, i) => {
      // Add a new page if content exceeds the page size
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 150; // Reset y position after adding a new page
      }

      generateTableRow(doc, y, [
        course.code,
        course.name,
        course.instructor,
        course.credits.toString(),
        course.schedule,
      ], false);
      y += 25;
    });

    // End the document
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating report' });
  }
};

// Function to generate table rows
function generateTableRow(doc, y, columns, isHeader) {
  const columnWidths = [80, 150, 120, 60, 100]; // Width for each column
  const x = 50; // Starting x position

  doc.fontSize(isHeader ? 12 : 10); // Larger font for headers
  doc.lineWidth(isHeader ? 1 : 0.5); // Thicker line for headers

  // Draw each column
  columns.forEach((text, i) => {
    doc.text(text, x + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
      width: columnWidths[i],
      align: 'left',
      lineBreak: false,
    });
  });

  // Draw a horizontal line under each row
  doc.moveTo(50, y + 20).lineTo(550, y + 20).stroke();
}
