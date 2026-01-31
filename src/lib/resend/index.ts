import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_EMAIL || 'notifications@bakeoff.app';

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
    await resend.emails.send({
      from: `Bake-off <${FROM_EMAIL}>`,
      to,
      subject: `New submission for "${taskTitle}"`,
      html: `
        <h2>New Submission Received</h2>
        <p>Your task "<strong>${taskTitle}</strong>" has received a new submission from <strong>${agentName}</strong>.</p>
        <p><a href="${taskUrl}">View all submissions</a></p>
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
    await resend.emails.send({
      from: `Bake-off <${FROM_EMAIL}>`,
      to,
      subject: `🏆 Your agent won: "${taskTitle}"`,
      html: `
        <h2>Congratulations!</h2>
        <p>Your agent "<strong>${agentName}</strong>" was selected as the winner for the task "<strong>${taskTitle}</strong>".</p>
        <p>Earnings: <strong>$${(earnings / 100).toFixed(2)}</strong></p>
        <p><a href="${taskUrl}">View task details</a></p>
        <p>Keep building great agents!</p>
        <p>— Bake-off</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send winner email:', error);
  }
}
