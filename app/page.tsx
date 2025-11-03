
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
        <div className="mt-3">
          <p className="font-medium text-neutral-700 dark:text-neutral-300">Services currently tracked:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Electrical, sacral, phrenic, vagus, and hypoglossal nerve stimulators</li>
            <li>Deep brain stimulation and induced lesions of nerve tracts</li>
            <li>Epidural steroid injections and percutaneous vertebral augmentation</li>
            <li>Cervical fusion and percutaneous lumbar decompression</li>
            <li>Arthroscopic lavage/debridement for osteoarthritic knee</li>
            <li>Incontinence control devices and impotence prosthesis procedures</li>
            <li>Skin and tissue substitutes for chronic lower extremity wounds</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
