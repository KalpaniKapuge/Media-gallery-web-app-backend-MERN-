import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (to, otp, purpose = 'verification') => {
  const subject = purpose === 'reset' ? 'Your password reset OTP' : 'Your registration OTP';
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });
};
