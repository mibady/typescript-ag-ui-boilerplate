import { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/contact-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Github, Twitter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | AI SaaS Boilerplate',
  description: 'Get in touch with our team for sales, support, or partnership inquiries.',
};

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Send us an email anytime',
    value: 'hello@example.com',
    href: 'mailto:hello@example.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our team',
    value: 'Available 9am-5pm PT',
    href: '#',
  },
  {
    icon: Github,
    title: 'GitHub',
    description: 'Report issues or contribute',
    value: 'github.com/yourrepo',
    href: 'https://github.com/yourusername/your-repo',
  },
  {
    icon: Twitter,
    title: 'Twitter',
    description: 'Follow us for updates',
    value: '@yourhandle',
    href: 'https://twitter.com/yourhandle',
  },
];

const faqs = [
  {
    question: 'How quickly will I get a response?',
    answer: 'We typically respond to all inquiries within 24 hours during business days. Enterprise customers receive priority support with faster response times.',
  },
  {
    question: 'Can I schedule a demo?',
    answer: 'Yes! Select "Sales Inquiry" or "Enterprise Plan" in the form above, and mention you would like to schedule a demo. Our team will reach out to arrange a time.',
  },
  {
    question: 'Do you offer technical support?',
    answer: 'All paid plans include technical support. Starter plans have community support, Professional plans include email support, and Enterprise plans receive 24/7 phone and email support.',
  },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Send us a message</h2>
                <p className="mt-2 text-muted-foreground">
                  Fill out the form below and our team will get back to you shortly.
                </p>
              </div>

              <ContactForm />
            </div>

            {/* Contact Methods & Info */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Other ways to reach us
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {contactMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <a
                        key={method.title}
                        href={method.href}
                        className="group block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{method.title}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <p className="mt-1 text-sm font-medium text-primary truncate">
                              {method.value}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index}>
                      <p className="font-semibold text-foreground">{faq.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Office Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Office Hours</CardTitle>
                  <CardDescription>When our team is available</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 5:00 PM PT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday - Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    Enterprise customers have access to 24/7 support.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
