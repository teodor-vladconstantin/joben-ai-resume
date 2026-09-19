'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useClerk } from '@clerk/nextjs'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signOut } = useClerk()
  const router = useRouter()
  const t = useTranslations('SettingsPage.dangerZone')

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Deletion failed')
      }
      await signOut()
      router.push('/')
    } catch {
      setError(t('errorMessage'))
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-(--muted)">
          <Trash2 size={14} />
          {t('deleteAccountLabel')}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="border-red-400/40 text-red-400 hover:border-red-400"
          onClick={() => setOpen(true)}
        >
          {t('deleteAccountButton')}
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle')}>
        <p className="text-sm text-(--muted)">
          {t('modalBody')}
        </p>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={deleting}>
            {t('cancel')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-red-400/40 text-red-400 hover:border-red-400"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t('deleting') : t('confirmDelete')}
          </Button>
        </div>
      </Modal>
    </>
  )
}
