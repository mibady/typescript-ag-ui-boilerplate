import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { aj } from '@/lib/arcjet';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/about',
  '/pricing',
  '/blog(.*)',
  '/docs(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Skip Arcjet in test/E2E environments where IP may not be available
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';
  
  if (!isTestEnv) {
    // Run Arcjet protection
    const decision = await aj.protect(req, {});

    // Check if request is blocked by Arcjet
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const resetTime = decision.reason.resetTime || Date.now() + 60000;
        const resetTimeNum = typeof resetTime === 'number' ? resetTime : Date.now() + 60000;
        const retryAfterSeconds = Math.ceil((resetTimeNum - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: 'Too many requests',
            retryAfter: resetTimeNum,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': decision.reason.max?.toString() || '0',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTimeNum.toString(),
              'Retry-After': retryAfterSeconds.toString(),
            },
          }
        );
      }

      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: 'Bot detected' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Request blocked' },
        { status: 403 }
      );
    }
  }

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all other routes
  await auth.protect();

  // For API routes, ensure organization context is set (optional for now)
  // TODO: Enable strict org requirement when multi-tenancy is needed
  // if (isApiRoute(req)) {
  //   const { orgId } = await auth();
  //   if (!orgId && !isPublicRoute(req)) {
  //     return new Response('Organization required', { status: 403 });
  //   }
  // }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
