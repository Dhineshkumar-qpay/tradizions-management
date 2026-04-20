import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"${process.env.SENDER_NAME || "Tradizions"}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f8fb; padding: 40px 0;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(90deg, #007bff, #0056b3); padding: 20px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0;">Account Verification</h2>
    </div>

    <!-- Body -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Hello,</p>
      
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        To complete your verification, please use the One-Time Password (OTP) below. 
        This code is valid for a limited time.
      </p>

      <!-- OTP Box -->
      <div style="background-color: #f1f5ff; border: 1px dashed #007bff; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
        <span style="font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #007bff;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        If you did not request this code, you can safely ignore this email. 
        Do not share this code with anyone for security reasons.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 15px; text-align: center;">
      <p style="font-size: 12px; color: #999; margin: 0;">
        © ${new Date().getFullYear()} Tradizions. All rights reserved.
      </p>
    </div>

  </div>
</div>
`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Nodemailer:", info.messageId);
    return true;
  } catch (error) {
    console.error("Nodemailer Error Details:", error.message);
    throw error;
  }
};
