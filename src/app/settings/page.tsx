import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/Sidebar'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Mail, CreditCard, Bell, Shield, Trash2 } from 'lucide-react'

export const metadata = {
  title: 'Settings | Joben',
  description: 'Manage your account settings.',
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <DashboardShell title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Account */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-heading font-medium text-text-primary">Account</h2>
              <p className="text-small text-text-secondary mt-1">
                Manage your profile and account details.
              </p>
            </div>
            <UserButton />
          </div>
          <Divider className="my-4" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-body text-text-secondary">
                <Mail size={14} className="text-text-muted" />
                Email settings
              </div>
              <Badge variant="neutral">Managed by Clerk</Badge>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
          <div>
            <h2 className="text-heading font-medium text-text-primary">Billing</h2>
            <p className="text-small text-text-secondary mt-1">
              Manage your subscription and payment methods.
            </p>
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <CreditCard size={14} className="text-text-muted" />
              Current plan
            </div>
            <Badge variant="accent">Free</Badge>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div>
            <h2 className="text-heading font-medium text-text-primary">Notifications</h2>
            <p className="text-small text-text-secondary mt-1">
              Control email and in-app notifications.
            </p>
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Bell size={14} className="text-text-muted" />
              Email notifications
            </div>
            <Badge variant="neutral">Enabled</Badge>
          </div>
        </div>

        {/* Security */}
        <div className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div>
            <h2 className="text-heading font-medium text-text-primary">Security</h2>
            <p className="text-small text-text-secondary mt-1">
              Password, 2FA, and session management.
            </p>
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Shield size={14} className="text-text-muted" />
              Two-factor authentication
            </div>
            <Badge variant="neutral">Managed by Clerk</Badge>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-bg-surface border border-error-muted rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <div>
            <h2 className="text-heading font-medium text-error">Danger Zone</h2>
            <p className="text-small text-text-secondary mt-1">
              Once you delete your account, there is no going back.
            </p>
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Trash2 size={14} className="text-text-muted" />
              Delete account
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
