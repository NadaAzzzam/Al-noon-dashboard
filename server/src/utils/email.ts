import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort ?? 587,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass }
  });
  return transporter;
}

/**
 * Send an email. No-op if SMTP is not configured (no error thrown).
 * Returns true if sent, false if skipped or failed (errors are logged).
 */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const trans = getTransporter();
  if (!trans) return false;
  const from = env.smtpFrom || env.smtpUser || "noreply@localhost";
  try {
    await trans.sendMail({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}
