
import dynamic from 'next/dynamic'
const SearchForm = dynamic(() => import('@/components/SearchForm'), { ssr: false })

export default function Page() {
  return (
    <main className="space-y-6">
      <SearchForm />
      <section className="text-sm text-neutral-600 dark:text-neutral-400">
        <p>States supported in this demo: TX, AZ, OH, OK, NJ, WA.</p>
      </section>
    </main>
  )
}
