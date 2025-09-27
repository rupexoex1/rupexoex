import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  try {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      throw new Error("SMTP_USER/SMTP_PASS env missing");
    }

    // Use Gmail with App Password (NOT your normal password)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // 465 => SSL/TLS
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Rupexo Team" <${user}>`,
      to,
      subject,
      html,
    });

    return { ok: true };
  } catch (err) {
    console.error("EMAIL_SEND_ERROR:", err);
    // Let the caller decide how to respond
    return { ok: false, error: err };
  }
};

export default sendEmail;
