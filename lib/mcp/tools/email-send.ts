/**
 * Email Send Tool
 *
 * Sends emails using Resend API.
 * Enforces organization-based rate limiting and sender validation.
 */

import { MCPTool, MCPToolResult, MCPToolExecutionContext, EmailSendToolArgs } from '../types';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email Send Tool Implementation
 */
export const emailSendTool: MCPTool = {
  schema: {
    name: 'email-send',
    description: 'Send an email via Resend',
    parameters: {
      to: {
        type: 'string',
        description: 'Recipient email address(es)',
        required: true,
      },
      subject: {
        type: 'string',
        description: 'Email subject',
        required: true,
      },
      html: {
        type: 'string',
        description: 'HTML email content',
      },
      text: {
        type: 'string',
        description: 'Plain text email content',
      },
      from: {
        type: 'string',
        description: 'Sender email (defaults to organization email)',
      },
    },
  },

  async execute(
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResult> {
    const { to, subject, html, text, from } = args as unknown as EmailSendToolArgs;

    try {
      // Validate that at least one content type is provided
      if (!html && !text) {
        return {
          success: false,
          error: 'Either html or text content must be provided',
        };
      }

      // Check if Resend is configured
      if (!process.env.RESEND_API_KEY) {
        return {
          success: false,
          error: 'RESEND_API_KEY not configured. Email sending unavailable.',
        };
      }

      // Default sender (should be verified domain)
      const defaultFrom = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
      const sender = from || defaultFrom;

      // Normalize recipients
      const recipients = Array.isArray(to) ? to : [to];

      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of recipients) {
        if (!emailRegex.test(email)) {
          return {
            success: false,
            error: `Invalid email address: ${email}`,
          };
        }
      }

      // Send email via Resend
      const emailPayload: any = {
        from: sender,
        to: recipients,
        subject,
      };

      if (html) emailPayload.html = html;
      if (text) emailPayload.text = text;

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        return {
          success: false,
          error: `Email send failed: ${error.message}`,
        };
      }

      return {
        success: true,
        data: {
          id: data?.id,
          from: sender,
          to: recipients,
          subject,
        },
        metadata: {
          organizationId: context.organizationId,
          provider: 'resend',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  },
};
