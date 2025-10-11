import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  company: z.string().max(100).optional(),
  inquiry: z.enum(['general', 'sales', 'enterprise', 'support', 'partnership', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = contactSchema.parse(body);

    // In a real application, you would:
    // 1. Store the message in your database
    // 2. Send an email notification to your team
    // 3. Send a confirmation email to the user
    // 4. Add to CRM system

    // For now, we'll just log it (in production, use proper logging)
    // eslint-disable-next-line no-console
    console.log('Contact form submission:', {
      ...validatedData,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending (in production, use Resend, SendGrid, etc.)
    // await sendEmail({
    //   to: 'support@example.com',
    //   from: validatedData.email,
    //   subject: `New ${validatedData.inquiry} inquiry from ${validatedData.name}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>Name:</strong> ${validatedData.name}</p>
    //     <p><strong>Email:</strong> ${validatedData.email}</p>
    //     ${validatedData.company ? `<p><strong>Company:</strong> ${validatedData.company}</p>` : ''}
    //     <p><strong>Inquiry Type:</strong> ${validatedData.inquiry}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${validatedData.message}</p>
    //   `,
    // });

    // Simulate storing in database
    // await db.contactSubmissions.create({
    //   data: {
    //     ...validatedData,
    //     status: 'pending',
    //     createdAt: new Date(),
    //   },
    // });

    return NextResponse.json(
      {
        success: true,
        message: 'Message received successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process your message. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
