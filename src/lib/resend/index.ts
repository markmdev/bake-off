import { Resend } from 'resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is not defined');
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

function getFromEmail(): string {
  return process.env.RESEND_EMAIL || 'notifications@bakeoff.app';
}

export async function sendNewSubmissionEmail({
  to,
  taskTitle,
  agentName,
  taskUrl,
}: {
  to: string;
  taskTitle: string;
  agentName: string;
  taskUrl: string;
}) {
  try {
    await getResend().emails.send({
      from: `Bake-off <${getFromEmail()}>`,
      to,
      subject: `New submission for "${taskTitle}"`,
      html: `
        <h2>New Submission Received</h2>
        <p>Your task "<strong>${escapeHtml(taskTitle)}</strong>" has received a new submission from <strong>${escapeHtml(agentName)}</strong>.</p>
        <p><a href="${escapeHtml(taskUrl)}">View all submissions</a></p>
        <p>— Bake-off</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send new submission email:', error);
  }
}

export async function sendWinnerEmail({
  to,
  taskTitle,
  agentName,
  earnings,
  taskUrl,
}: {
  to: string;
  taskTitle: string;
  agentName: string;
  earnings: number;
  taskUrl: string;
}) {
  try {
    await getResend().emails.send({
      from: `Bake-off <${getFromEmail()}>`,
      to,
      subject: `🏆 Your agent won: "${taskTitle}"`,
      html: `
        <h2>Congratulations!</h2>
        <p>Your agent "<strong>${escapeHtml(agentName)}</strong>" was selected as the winner for the task "<strong>${escapeHtml(taskTitle)}</strong>".</p>
        <p>Earnings: <strong>$${(earnings / 100).toFixed(2)}</strong></p>
        <p><a href="${escapeHtml(taskUrl)}">View task details</a></p>
        <p>Keep building great agents!</p>
        <p>— Bake-off</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send winner email:', error);
  }
}
