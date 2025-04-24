require('dotenv').config();
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const sendMessage = async ({ callMessage }) => {
  const response = {
    sms: { success: false, message: '' },
    email: { success: false, message: '' },
  };

  if (!callMessage || typeof callMessage !== 'string' || !callMessage.trim()) {
    return JSON.stringify({
      sent: false,
      error: 'Invalid or empty message provided.',
    });
  }

  const messageBody = callMessage.trim();

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const smsPromise = client.messages
    .create({
      body: messageBody,
      from: process.env.FROM_NUMBER,
      to: process.env.TO_NUMBER,
    })
    .then(() => {
      response.sms.success = true;
      response.sms.message = 'SMS sent successfully';
    })
    .catch((error) => {
      console.warn('SMS failed:', error.message);
      response.sms.message = error.message;
    });

  const emailPromise = sgMail
    .send({
      to: process.env.RECIPIENT_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: 'Shaniqua Darmain: New Message from Caller',
      text: messageBody,
    })
    .then(() => {
      response.email.success = true;
      response.email.message = 'Email sent successfully';
    })
    .catch((error) => {
      console.warn('Email failed:', error.message);
      response.email.message = error.message;
    });

  await Promise.allSettled([smsPromise, emailPromise]);

  return JSON.stringify({
    sent: response.sms.success || response.email.success,
    details: response,
  });
};

module.exports = sendMessage;