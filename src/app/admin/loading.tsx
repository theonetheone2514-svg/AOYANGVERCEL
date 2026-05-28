import LoadingSpinner from '@/components/LoadingSpinner'

export default function AdminLoading() {
  return (
    <div className="min-h-dvh bg-gray-900 flex items-center justify-center">
      <LoadingSpinner text="กำลังโหลด..." />
    </div>
  )
}
