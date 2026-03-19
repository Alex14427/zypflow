import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: {
  to: string; subject: string; html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: 'Zypflow <hello@zypflow.com>', to, subject, html,
  });
  if (error) console.error('Email error:', error);
  return { data, error };
}

export async function sendWelcomeEmail(email: string, name: string, plan: string) {
  return sendEmail({
    to: email,
    subject: `Welcome to Zypflow, ${name}!`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6c3cff">Welcome to Zypflow!</h1>
      <p>Hi ${name}, your <strong>${plan}</strong> plan is active.</p>
      <ol>
        <li><a href="https://app.zypflow.com/dashboard">Log in to dashboard</a></li>
        <li>Add your business details, services, and FAQs</li>
        <li>Install the chat widget (one line of code)</li>
        <li>Set your Google review link</li>
      </ol>
      <p>Need help? <a href="https://calendly.com/alex-zypflow/30min">Book onboarding</a></p>
      <p>Best,<br/>The Zypflow Team</p>
    </div>`,
  });
}
