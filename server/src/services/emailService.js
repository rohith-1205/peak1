const nodemailer = require('nodemailer');
const env = require('../config/env');

const createTransporter = () => {
  // If SMTP is not configured, we'll use ethereal email for testing
  // In production, the user MUST provide real SMTP credentials
  return nodemailer.createTransport({
    host: env.EMAIL_HOST || 'smtp.ethereal.email',
    port: env.EMAIL_PORT || 587,
    auth: {
      user: env.EMAIL_USER || 'test@ethereal.email',
      pass: env.NODE_ENV === 'development' ? (env.EMAIL_PASS || 'password') : env.EMAIL_PASS,
    }
  });
};

const sendRegistrationEmail = async (registration, event) => {
  try {
    const transporter = createTransporter();

    const participantName = registration.participantDetails?.fullName || 'Participant';
    const participantEmail = registration.participantDetails?.email;

    if (!participantEmail) {
      console.warn('No email found for participant, skipping registration email.');
      return;
    }

    const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    // Using a public QR generator for the email template
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${registration.registrationId}`;

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Registration Confirmed!</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eeeeee;">
          <h2 style="color: #333333; margin-top: 0;">Hello ${participantName},</h2>
          <p style="color: #555555; line-height: 1.5;">
            You are officially registered for <strong>${event.title}</strong>! We are excited to see you there.
          </p>
          
          <div style="background-color: #f4f6f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333333;"><strong>Event Details:</strong></p>
            <p style="margin: 5px 0; color: #555555;">📅 Date: ${eventDate}</p>
            <p style="margin: 5px 0; color: #555555;">⏰ Time: ${event.startTime}</p>
            <p style="margin: 5px 0; color: #555555;">📍 Venue: ${event.venue}, ${event.city}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #777777; font-size: 14px; margin-bottom: 10px;">Your Gate Entry QR Code (Pass ID: ${registration.registrationId})</p>
            <img src="${qrUrl}" alt="Gate Entry QR Code" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
            <p style="color: #777777; font-size: 12px; margin-top: 10px;">Please present this code at the entry gate.</p>
          </div>
          
          <p style="color: #555555; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you have any questions, please contact the organizer.
          </p>
        </div>
      </div>
    `;

    const subjectPrefix = env.APP_ENV === 'staging' ? '[STAGING] ' : '';

    const mailOptions = {
      from: '"Peak1 Events" <noreply@peak1.com>',
      to: participantEmail,
      subject: `${subjectPrefix}Registration Confirmed: ${event.title}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Registration email sent to ${participantEmail} [Message ID: ${info.messageId}]`);
  } catch (error) {
    console.error('Error sending registration email:', error);
  }
};

module.exports = {
  sendRegistrationEmail
};
