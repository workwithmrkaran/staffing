'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import type { ApiResult } from '@/lib/types'

export function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = (await response.json().catch(() => null)) as ApiResult | null
      if (!response.ok || !result?.success) throw new Error(result?.message ?? 'Sign-in failed.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign-in failed.')
      setPassword('')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_-30px_rgba(6,27,61,.28)]">
        <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#061b3d] text-brand-400">
          <LockKeyhole className="size-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[.24em] text-navy-600">A3A Staffing</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#061b3d]">Admin console</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the admin password to continue.</p>
        <label className="mt-6 block text-sm font-semibold text-[#061b3d]">
          Password
          <input
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-100"
          />
        </label>
        <button type="submit" disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#061b3d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy-700 disabled:opacity-70">
          {loading && <Loader2 className="size-4 animate-spin" />} Sign in
        </button>
      </form>
    </main>
  )
}
