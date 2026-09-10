import Mailgun from "mailgun.js";
import formData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const mailgun = new Mailgun(formData);
let mgClient = null;

const getMgClient = () => {
  if (!mgClient) {
    mgClient = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });
  }
  return mgClient;
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const senderMail = "support@tradizions.in";
    const mg = getMgClient();


    const htmlContent = `
<div style="margin:0; padding:40px 20px; background-color:#f5f6f0; font-family:'Segoe UI',Arial,sans-serif;">

  <div style="max-width:580px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e3e6d8; box-shadow:0 8px 30px rgba(60,70,30,0.08);">

    <!-- Header -->
    <div style="padding:32px 30px; text-align:center; background:#556B2F;">

      <div style="display:inline-block; margin-bottom:12px; padding:7px 13px; border:1px solid rgba(255,255,255,0.3); border-radius:20px;">
        <span style="font-size:11px; font-weight:600; letter-spacing:1.5px; color:#eef2e5; text-transform:uppercase;">
          Tradizions Security
        </span>
      </div>

      <h2 style="margin:0; color:#ffffff; font-size:24px; font-weight:600; letter-spacing:-0.3px;">
        Account Verification
      </h2>

      <p style="margin:8px 0 0; color:#dfe6d2; font-size:13px;">
        Secure verification for your account
      </p>

    </div>

    <!-- Body -->
    <div style="padding:38px 35px 32px;">

      <p style="margin:0 0 16px; font-size:16px; color:#2f351f; font-weight:600;">
        Hello,
      </p>

      <p style="margin:0; font-size:14px; color:#68705a; line-height:1.7;">
        We received a request to verify your account. Please use the
        one-time verification code below to continue.
      </p>

      <!-- OTP Section -->
      <div style="margin:30px 0; padding:26px 20px; text-align:center; background:#f5f7ef; border:1px solid #dfe4d2; border-radius:12px;">

        <p style="margin:0 0 12px; font-size:11px; font-weight:600; letter-spacing:1.5px; color:#727b61; text-transform:uppercase;">
          Your Verification Code
        </p>

        <div style="display:inline-block; padding:12px 22px; background:#ffffff; border:1px solid #cdd5bc; border-radius:8px;">
          <span style="font-size:32px; font-weight:700; letter-spacing:7px; color:#FF8C00;">
            ${otp}
          </span>
        </div>

        <p style="margin:14px 0 0; font-size:12px; color:#929987;">
          This code is valid for a limited time.
        </p>

      </div>

      <!-- Security Notice -->
      <div style="padding:15px 16px; background:#fafbf7; border-left:3px solid #556B2F; border-radius:4px;">

        <p style="margin:0; font-size:13px; color:#68705a; line-height:1.6;">
          If you did not request this verification code, you can safely
          ignore this email. For your security, never share this code
          with anyone.
        </p>

      </div>

      <p style="margin:28px 0 0; font-size:13px; color:#68705a; line-height:1.6;">
        Regards,<br>
        <strong style="color:#556B2F;">Tradizions Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="padding:20px 25px; text-align:center; background:#f8f9f4; border-top:1px solid #e8eadf;">
      <p style="margin:0; font-size:11px; color:#a6ac9d;">
        © ${new Date().getFullYear()} Tradizions. All rights reserved.
      </p>

    </div>

  </div>

</div>
`;

    const info = await mg.messages.create("tradizions.in", {
      from: `"Tradizions" <${senderMail}>`,
      to: [email],
      subject: "Your Verification Code",
      text: "Notification",
      html: htmlContent,
      "h:Reply-To": senderMail
    });

    console.log("Sending to:", email);
    console.log("Email sent successfully via Mailgun:", info.id);
    return true;
  } catch (error) {
    console.error("Mailgun Error Details:", error.message);
    throw error;
  }
};
