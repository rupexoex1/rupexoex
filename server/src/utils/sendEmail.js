import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // 465 => true
      auth: {
        user: process.env.SMTP_USER, // full gmail address
        pass: process.env.SMTP_PASS, // App Password (16 chars)
      },
    });

    await transporter.sendMail({
      from: `"Rupexo Team" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("EMAIL_SEND_ERROR:", err);
    throw err; // taake controller me 500 ka reason clear dikhe
  }
};

export default sendEmail;
