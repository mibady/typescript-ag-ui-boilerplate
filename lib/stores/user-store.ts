/**
 * User Store with Zustand
 *
 * Manages user profile, subscription, and organization data
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  features: Record<string, boolean>;
  limits: {
    messages_per_month: number;
    tokens_per_month: number;
    documents: number;
    team_members: number;
    sessions: number;
    api_calls_per_day: number;
  };
}

export interface Usage {
  messages_per_month: number;
  tokens_per_month: number;
  documents: number;
  api_calls_per_day: number;
}

interface UserState {
  // User data
  user: UserProfile | null;
  organization: Organization | null;
  subscription: Subscription | null;
  usage: Usage | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setOrganization: (org: Organization | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setUsage: (usage: Usage | null) => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Derived getters
  isPro: () => boolean;
  isEnterprise: () => boolean;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (metric: keyof Usage) => boolean;

  fetchSubscription: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  organization: null,
  subscription: null,
  usage: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setOrganization: (org) => set({ organization: org }),
      setSubscription: (subscription) => set({ subscription }),
      setUsage: (usage) => set({ usage }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      isPro: () => {
        const { subscription } = get();
        return subscription?.planName === 'pro';
      },

      isEnterprise: () => {
        const { subscription } = get();
        return subscription?.planName === 'enterprise';
      },

      hasFeature: (feature) => {
        const { subscription } = get();
        return subscription?.features?.[feature] ?? false;
      },

      isWithinLimit: (metric) => {
        const { subscription, usage } = get();
        if (!subscription || !usage) return true;

        const limit = subscription.limits[metric];
        const currentUsage = usage[metric];

        return currentUsage < limit;
      },

      fetchSubscription: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/billing/subscription');

          if (!response.ok) {
            throw new Error('Failed to fetch subscription');
          }

          const data = await response.json();

          set({
            subscription: {
              id: data.subscription.id,
              planId: data.plan.id,
              planName: data.plan.name,
              planDisplayName: data.plan.display_name,
              status: data.subscription.status,
              billingCycle: data.subscription.billing_cycle,
              currentPeriodEnd: data.subscription.current_period_end,
              trialEnd: data.subscription.trial_end,
              features: data.plan.features,
              limits: data.plan.limits,
            },
            usage: data.usage,
            isLoading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch subscription',
            isLoading: false,
          });
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'UserStore' }
  )
);

// Selectors
export const useUser = () => useUserStore((state) => state.user);

export const useOrganization = () =>
  useUserStore((state) => state.organization);

export const useSubscription = () =>
  useUserStore((state) => state.subscription);

export const useUsage = () => useUserStore((state) => state.usage);

export const useSubscriptionStatus = () =>
  useUserStore((state) => ({
    isPro: state.isPro(),
    isEnterprise: state.isEnterprise(),
    hasFeature: state.hasFeature,
    isWithinLimit: state.isWithinLimit,
  }));
