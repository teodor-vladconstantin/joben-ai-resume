import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { AccountUserButton } from '@/components/settings/AccountUserButton'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { ExportDataButton } from '@/components/settings/ExportDataButton'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Mail, CreditCard, Bell, Shield } from 'lucide-react'

export const metadata = {
  title: 'Settings | Joben',
  description: 'Manage your account settings.',
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-(--foreground) mb-8">Settings</h1>

          <div className="space-y-6">
            {/* Account */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-(--foreground)">Account</h2>
                  <p className="text-sm text-(--muted) mt-1">
                    Manage your profile and account details.
                  </p>
                </div>
                <AccountUserButton />
              </div>
              <Divider className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-(--muted)">
                    <Mail size={14} />
                    Email settings
                  </div>
                  <Badge variant="muted">Managed by Clerk</Badge>
                </div>
                <ExportDataButton />
              </div>
            </div>

            {/* Billing */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">Billing</h2>
                <p className="text-sm text-(--muted) mt-1">
                  Manage your subscription and payment methods.
                </p>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-(--muted)">
                  <CreditCard size={14} />
                  Current plan
                </div>
                <Badge variant="solid">Free</Badge>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">Notifications</h2>
                <p className="text-sm text-(--muted) mt-1">
                  Control email and in-app notifications.
                </p>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-(--muted)">
                  <Bell size={14} />
                  Email notifications
                </div>
                <Badge variant="muted">Enabled</Badge>
              </div>
            </div>

            {/* Security */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)">
              <div>
                <h2 className="text-lg font-bold text-(--foreground)">Security</h2>
                <p className="text-sm text-(--muted) mt-1">
                  Password, 2FA, and session management.
                </p>
              </div>
              <Divider className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-(--muted)">
                  <Shield size={14} />
                  Two-factor authentication
                </div>
                <Badge variant="muted">Managed by Clerk</Badge>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-red-400/30">
              <div>
                <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
                <p className="text-sm text-(--muted) mt-1">
                  Once you delete your account, there is no going back.
                </p>
              </div>
              <Divider className="my-4" />
              <DeleteAccountButton />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
