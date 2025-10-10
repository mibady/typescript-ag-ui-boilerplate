import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamMemberList } from '@/components/team/team-member-list';
import { InviteDialog } from '@/components/team/invite-dialog';
import { Users, UserPlus, Shield, Crown } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        <InviteDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+2</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Full access granted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage your organization's team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMemberList />
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Understanding team roles and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Owner</h4>
                <Badge variant="outline">Full Access</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete control over the organization, billing, and all settings. Can manage all team members and their roles.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Admin</h4>
                <Badge variant="outline">Most Access</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Can manage team members, access all features, and configure organization settings. Cannot manage billing or delete the organization.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Member</h4>
                <Badge variant="outline">Standard Access</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Can use all AI features, upload documents, and collaborate with the team. Cannot manage team members or organization settings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-slate-500/10 p-2">
              <UserPlus className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Guest</h4>
                <Badge variant="outline">Limited Access</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                View-only access to shared resources. Cannot create new content or modify existing data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
