const nodemailer = require('nodemailer');
const env = require('../config/env');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST || 'smtp.ethereal.email',
    port: env.EMAIL_PORT || 587,
    auth: {
      user: env.EMAIL_USER || 'test@ethereal.email',
      pass: env.NODE_ENV === 'development' ? (env.EMAIL_PASS || 'password') : env.EMAIL_PASS,
    }
  });
};

/**
 * Send email via Web3Forms API (HTTP POST)
 */
const sendViaWeb3Forms = async ({ toEmail, subject, fromName, htmlContent }) => {
  const accessKey = env.WEB3FORMS_ACCESS_KEY || 'b89561b0-0eee-43b1-87f5-b23a217eb881';
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: subject,
        from_name: fromName || 'Peak1 Events',
        email: toEmail,
        to_email: toEmail,
        message: htmlContent
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log(`[Web3Forms Email] Automated email sent to ${toEmail} successfully.`);
      return true;
    } else {
      console.warn(`[Web3Forms Warning]: ${data.message || 'Submission failed'}`);
      return false;
    }
  } catch (err) {
    console.error('[Web3Forms Error]:', err.message);
    return false;
  }
};

const sendRegistrationEmail = async (registration, event) => {
  try {
    const participantName = registration.participantDetails?.fullName || 'Participant';
    const participantEmail = registration.participantDetails?.email;

    if (!participantEmail) {
      console.warn('No email found for participant, skipping registration email.');
      return;
    }

    const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    // Public QR Code Generator URL for email rendering
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registration.registrationId)}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f17; color: #ffffff; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="background-color: #0f172a; padding: 24px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 2px solid #06b6d4;">
          <h1 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Registration Confirmed!</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Peak1 Race & Event Operations</p>
        </div>
        
        <div style="background-color: #020617; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #f8fafc; margin-top: 0; font-size: 20px;">Hello ${participantName},</h2>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
            Your entry pass for <strong>${event.title}</strong> has been officially confirmed! Present this digital pass or QR code at the entry gate.
          </p>
          
          <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #1e293b;">
            <p style="margin: 0 0 12px 0; color: #06b6d4; font-weight: bold; font-size: 14px; text-transform: uppercase;">Event Details:</p>
            <p style="margin: 6px 0; color: #e2e8f0; font-size: 14px;"><strong>📅 Date:</strong> ${eventDate}</p>
            <p style="margin: 6px 0; color: #e2e8f0; font-size: 14px;"><strong>⏰ Time:</strong> ${event.startTime || 'Standard Gate Time'} - ${event.endTime || 'Closing'}</p>
            <p style="margin: 6px 0; color: #e2e8f0; font-size: 14px;"><strong>📍 Venue:</strong> ${event.venue}, ${event.city}</p>
            <p style="margin: 6px 0; color: #e2e8f0; font-size: 14px;"><strong>🎟️ Pass ID:</strong> <span style="font-family: monospace; color: #38bdf8; font-weight: bold;">${registration.registrationId}</span></p>
          </div>

          <div style="text-align: center; margin: 30px 0; background-color: #ffffff; padding: 20px; border-radius: 12px;">
            <p style="color: #0f172a; font-size: 13px; font-weight: bold; margin-top: 0; margin-bottom: 12px; text-transform: uppercase;">Official Gate Check-in QR Pass</p>
            <img src="${qrUrl}" alt="Gate Entry QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
            <p style="color: #64748b; font-size: 11px; margin-top: 10px; margin-bottom: 0;">Scan at gate for instant check-in</p>
          </div>
          
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px;">
            Peak1 Event Operations • Engineered for Speed & Reliability
          </p>
        </div>
      </div>
    `;

    const subjectPrefix = env.APP_ENV === 'staging' ? '[STAGING] ' : '';
    const subject = `${subjectPrefix}Registration Confirmed: ${event.title} [${registration.registrationId}]`;

    // Attempt Web3Forms submission first
    const sentViaApi = await sendViaWeb3Forms({
      toEmail: participantEmail,
      subject,
      fromName: 'Peak1 Events',
      htmlContent
    });

    if (!sentViaApi) {
      // Fallback to SMTP nodemailer if Web3Forms fails
      const transporter = createTransporter();
      const mailOptions = {
        from: '"Peak1 Events" <noreply@peak1.app>',
        to: participantEmail,
        subject,
        html: htmlContent
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`Registration email sent via SMTP fallback to ${participantEmail} [Message ID: ${info.messageId}]`);
    }
  } catch (error) {
    console.error('Error sending registration email:', error);
  }
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f17; color: #ffffff; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="background-color: #0f172a; padding: 24px; border-radius: 10px 10px 0 0; text-align: center; border-bottom: 2px solid #06b6d4;">
          <h1 style="color: #06b6d4; margin: 0; font-size: 24px;">Peak1 Password Reset</h1>
        </div>
        
        <div style="background-color: #020617; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #f8fafc; margin-top: 0;">Hello ${user.name || 'User'},</h2>
          <p style="color: #cbd5e1; line-height: 1.6;">
            We received a request to reset your password for your <strong>Peak1</strong> account.
          </p>
          <p style="color: #cbd5e1; line-height: 1.6;">
            Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #06b6d4; color: #020617; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-size: 15px; text-transform: uppercase;">
              Reset Password Now
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-top: 25px; word-break: break-all;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    const subjectPrefix = env.APP_ENV === 'staging' ? '[STAGING] ' : '';
    const subject = `${subjectPrefix}Reset Your Password - Peak1`;

    const sentViaApi = await sendViaWeb3Forms({
      toEmail: user.email,
      subject,
      fromName: 'Peak1 Platform',
      htmlContent
    });

    if (!sentViaApi) {
      const transporter = createTransporter();
      const mailOptions = {
        from: '"Peak1 Platform" <noreply@peak1.app>',
        to: user.email,
        subject,
        html: htmlContent
      };
      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendRegistrationEmail,
  sendPasswordResetEmail
};
