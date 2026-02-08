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

export type SendMailResult = { ok: true } | { ok: false; error: string };

/**
 * Send an email. No-op if SMTP is not configured (no error thrown).
 * Returns { ok: true } if sent, { ok: false, error } if skipped or failed (errors are logged).
 */
export async function sendMail(to: string, subject: string, html: string): Promise<SendMailResult> {
  const trans = getTransporter();
  if (!trans) return { ok: false, error: "SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)" };
  const from = env.smtpFrom || env.smtpUser || "noreply@localhost";
  try {
    await trans.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed:", err);
    return { ok: false, error: msg };
  }
}
