/**
 * POST /api/jobs/send-email
 * 
 * Background job handler for sending emails.
 * Called by Upstash QStash to send transactional emails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/upstash/qstash';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Verify QStash signature
    const signature = req.headers.get('upstash-signature');
    const body = await req.text();

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing QStash signature' },
        { status: 401 }
      );
    }

    const isValid = await verifySignature(signature, body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid QStash signature' },
        { status: 401 }
      );
    }

    // Parse request body
    const { to, subject, template, data } = JSON.parse(body);

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    console.log(`Sending email to ${to}: ${subject}`);

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to,
      subject,
      html: generateEmailHTML(template, data),
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Failed to send email');
    }

    console.log(`Email sent successfully: ${emailData?.id}`);

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error in send-email job:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate email HTML from template
 */
function generateEmailHTML(template: string, data: Record<string, any>): string {
  // Simple template system - replace {{variable}} with data
  let html = getEmailTemplate(template);
  
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  
  return html;
}

/**
 * Get email template by name
 */
function getEmailTemplate(name: string): string {
  const templates: Record<string, string> = {
    'document-processed': `
      <h1>Document Processed</h1>
      <p>Your document "{{documentName}}" has been successfully processed.</p>
      <p>You can now search and query this document using our AI assistant.</p>
      <a href="{{documentUrl}}">View Document</a>
    `,
    'welcome': `
      <h1>Welcome to {{appName}}!</h1>
      <p>Hi {{userName}},</p>
      <p>Thanks for signing up. We're excited to have you on board.</p>
      <a href="{{dashboardUrl}}">Get Started</a>
    `,
    'default': `
      <p>{{message}}</p>
    `,
  };

  return templates[name] || templates['default'];
}
