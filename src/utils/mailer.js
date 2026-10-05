import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter = env.mail.host
  ? nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: { user: env.mail.user, pass: env.mail.pass }
    })
  : null

// Sem SMTP configurado (dev), o e-mail é só exibido no console
export async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.info(`[mail:dev] para=${to} assunto="${subject}"\n${html}`)
    return
  }
  await transporter.sendMail({ from: env.mail.from, to, subject, html })
}
