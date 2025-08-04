import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
  console.warn('Email credentials or host/port missing in .env; email sending may fail.');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (to, otp, purpose = 'verification') => {
  const subject = purpose === 'reset' ? 'Your password reset OTP' : 'Your registration OTP';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4;">
      <p>Hi,</p>
      <p>Your ${purpose === 'reset' ? 'password reset' : 'registration'} OTP code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
