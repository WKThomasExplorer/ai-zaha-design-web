import { Resend } from 'resend';
import { WelcomeEmail } from '@/lib/emails/welcome-email';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 发送 AI ZAHA 欢迎邮件（仅服务端调用；依赖 RESEND_API_KEY；正文为 React Email 组件）。
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  return resend.emails.send({
    from: 'AI ZAHA <hello@aizaha.com>',
    to: userEmail,
    subject: 'Welcome to AI ZAHA — your AI architecture studio',
    react: <WelcomeEmail userName={userName} />,
  });
}
