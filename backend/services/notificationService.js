const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send email notification
exports.sendEmailNotification = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"AcademiPlan" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err);
  }
};

// Send SMS notification
exports.sendSMSNotification = async (to, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error('SMS send error:', err);
  }
};

// Send push notification (requires frontend implementation)
exports.sendPushNotification = async (userIds, title, body, data) => {
  // Implementation depends on your push notification service
  // (Firebase, OneSignal, etc.)
};