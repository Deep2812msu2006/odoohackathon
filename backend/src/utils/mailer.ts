import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (to: string, otp: string) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Your Transitops Login Code',
    text: `Your login code is: ${otp}. It will expire in 15 minutes.`,
    html: `<p>Your login code is: <strong>${otp}</strong>. It will expire in 15 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
