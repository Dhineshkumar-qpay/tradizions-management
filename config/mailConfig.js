import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, 
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true
});
