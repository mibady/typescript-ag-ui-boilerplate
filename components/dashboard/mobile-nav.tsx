'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  Users,
  Settings,
  BarChart3,
  BookOpen,
  Home,
  Menu,
} from 'lucide-react';

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    name: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: Database,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    name: 'Documentation',
    href: '/docs',
    icon: BookOpen,
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <span className="text-lg">AI SaaS</span>
          </Link>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.name}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-accent text-accent-foreground'
                )}
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
