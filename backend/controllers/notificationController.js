const twilio = require('twilio');
require('dotenv').config();

exports.sendSMS = async (req, res) => {
  try {
    const { mobile, message } = req.body;

    // 1. Validate inputs more thoroughly
    if (!mobile || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Mobile number and message are required' 
      });
    }

    // Validate Sri Lankan mobile number (10 digits starting with 0)
    if (!/^0\d{9}$/.test(mobile)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid Sri Lankan mobile number (should be 10 digits starting with 0)' 
      });
    }

    // 2. Initialize Twilio client with error handling
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials missing');
      return res.status(500).json({
        success: false,
        message: 'SMS service configuration error'
      });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Convert to international format (replace leading 0 with +94)
    const internationalNumber = `+94${mobile.substring(1)}`;

    // 3. Send SMS with timeout
    const response = await Promise.race([
      client.messages.create({
        body: message.substring(0, 1600), // Truncate to Twilio's limit
        from: process.env.TWILIO_PHONE_NUMBER,
        to: internationalNumber
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SMS timeout')), 5000)
    )]);

    // 4. Return standardized response
    return res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        sid: response.sid,
        mobile: internationalNumber,
        length: message.length
      }
    });

  } catch (err) {
    console.error('SMS sending error:', err);
    
    // Handle Twilio-specific errors
    const errorMessage = err.code === 'ENOTFOUND' 
      ? 'SMS service unavailable'
      : err.message.includes('timeout')
        ? 'SMS service timeout'
        : err.message.includes('invalid phone number')
          ? 'Invalid phone number format'
          : 'Failed to send SMS';

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};