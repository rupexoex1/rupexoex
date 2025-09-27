// utils/sendEmail.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,   // "true" | "false"
  FROM_EMAIL,    // e.g. 'Rupexo <no-reply@your-domain>'
} = process.env;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const err = new Error("SMTP_NOT_CONFIGURED");
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE).toLowerCase() === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export default async function sendEmail(to, subject, html) {
  const t = getTransporter();
  const from = FROM_EMAIL || SMTP_USER;
  return t.sendMail({ from, to, subject, html });
}
