import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Extract only serializable data from the user object
  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddresses: user.emailAddresses.map(email => ({
      emailAddress: email.emailAddress
    }))
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user.firstName}!
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Let&apos;s set up your workspace and preferences
          </p>
        </div>
        <OnboardingForm user={userData} />
      </div>
    </div>
  );
}
