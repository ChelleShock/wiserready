import Link from 'next/link'

import { listFeedback } from '@/lib/feedbackDb'

export const revalidate = 0

export default async function FeedbackAdminPage() {
  const feedbackEntries = await listFeedback()

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Feedback Inbox</h1>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-500 underline-offset-4 hover:underline"
        >
          ← Back to app
        </Link>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Showing the most recent {feedbackEntries.length} submissions. Add a
        SUPABASE service key in deployment settings to access this page safely.
      </p>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Created</th>
              <th className="px-4 py-2 text-left font-semibold">Rule ID</th>
              <th className="px-4 py-2 text-left font-semibold">Signal</th>
              <th className="px-4 py-2 text-left font-semibold">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {feedbackEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  No feedback yet. Encourage users to submit a reaction to see it
                  here.
                </td>
              </tr>
            ) : (
              feedbackEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.ruleId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                        entry.signal === 'up'
                          ? 'border-green-200 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/50 dark:text-green-200'
                          : 'border-red-200 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/50 dark:text-red-200'
                      }`}
                    >
                      {entry.signal === 'up' ? '👍 Accurate' : '👎 Needs fix'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-3xl align-top">
                    {entry.comment ? (
                      <p className="whitespace-pre-wrap break-words">
                        {entry.comment}
                      </p>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
