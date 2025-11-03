
import dynamic from 'next/dynamic'
const SearchForm = dynamic(() => import('@/components/SearchForm'), { ssr: false })

export default function Page() {
  return (
    <main className="space-y-6">
      <SearchForm />
      <section className="text-sm text-neutral-600 dark:text-neutral-400">
        <p>
          WISeR pilot runs January&nbsp;1,&nbsp;2026&nbsp;–&nbsp;December&nbsp;31,&nbsp;2031 with coverage in Texas (JH), Arizona (JF), Ohio (J15), Oklahoma (JH), New Jersey (JL), and Washington (JF).
        </p>
      </section>
    </main>
  )
}
