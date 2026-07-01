import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { FileText, Sparkles, Mail, Plus, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | Joben',
  description: 'Manage your resumes, cover letters, and AI reviews.',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <DashboardShell
      title="Dashboard"
      actions={
        <Link href="/resumes/new">
          <Button variant="primary" size="sm">
            <Plus size={14} />
            New Resume
          </Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-surface border border-border-soft rounded-lg p-4 animate-fade-in-up">
          <Eyebrow className="mb-1">
            <FileText size={12} />
            Resumes
          </Eyebrow>
          <div className="text-title font-semibold text-text-primary">0</div>
        </div>
        <div
          className="bg-bg-surface border border-border-soft rounded-lg p-4 animate-fade-in-up"
          style={{ animationDelay: '40ms' }}
        >
          <Eyebrow className="mb-1">
            <Sparkles size={12} />
            AI Reviews
          </Eyebrow>
          <div className="text-title font-semibold text-text-primary">0</div>
        </div>
        <div
          className="bg-bg-surface border border-border-soft rounded-lg p-4 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <Eyebrow className="mb-1">
            <Mail size={12} />
            Cover Letters
          </Eyebrow>
          <div className="text-title font-semibold text-text-primary">0</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-heading font-medium text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/resumes/new"
            className="bg-bg-surface border border-border-soft rounded-lg p-4 hover:border-border-medium hover:bg-bg-hover cursor-pointer transition-colors animate-fade-in-up"
          >
            <div className="flex items-center gap-2 text-accent mb-2">
              <FileText size={14} />
              <span className="text-body font-medium text-text-primary">Create Resume</span>
            </div>
            <p className="text-small text-text-secondary">
              Build an ATS-optimized resume from scratch or with AI assistance.
            </p>
          </Link>
          <Link
            href="/cover-letters/new"
            className="bg-bg-surface border border-border-soft rounded-lg p-4 hover:border-border-medium hover:bg-bg-hover cursor-pointer transition-colors animate-fade-in-up"
            style={{ animationDelay: '40ms' }}
          >
            <div className="flex items-center gap-2 text-accent mb-2">
              <Mail size={14} />
              <span className="text-body font-medium text-text-primary">Cover Letter</span>
            </div>
            <p className="text-small text-text-secondary">
              Generate a tailored cover letter for any job posting.
            </p>
          </Link>
          <Link
            href="/pricing"
            className="relative bg-accent-muted border border-accent-border rounded-lg p-4 hover:bg-accent/10 cursor-pointer transition-colors animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <Badge variant="accent" className="absolute -top-2 right-3">Pro</Badge>
            <div className="flex items-center gap-2 text-accent mb-2">
              <Sparkles size={14} />
              <span className="text-body font-medium text-text-primary">Upgrade to Pro</span>
            </div>
            <p className="text-small text-text-secondary">
              Unlock AI review, scoring, and content suggestions.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent resumes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-medium text-text-primary">Recent Resumes</h2>
          <Link
            href="/resumes/new"
            className="inline-flex items-center gap-1 text-accent text-xs hover:underline"
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="bg-bg-surface border border-border-soft rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-faint flex items-center justify-between">
            <span className="text-xs text-text-muted uppercase tracking-wide">No resumes yet</span>
            <Badge variant="accent">Get started</Badge>
          </div>
          <div className="px-4 py-8 text-center">
            <p className="text-body text-text-secondary mb-3">
              Create your first resume to see it here.
            </p>
            <Link href="/resumes/new">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                Create Resume
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
