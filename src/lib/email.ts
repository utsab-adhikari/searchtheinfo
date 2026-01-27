import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT, 10)
  : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn("[email] SMTP environment variables are not fully configured.");
}

const fromAddress =
  process.env.EMAIL_FROM || "SearchTheInfo <no-reply@searchtheinfo.com>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("[email] Missing SMTP configuration, cannot send email.");
    return { success: false, error: "SMTP not configured" } as const;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true, messageId: info.messageId } as const;
  } catch (error) {
    console.error("[email] Failed to send email", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } as const;
  }
}
