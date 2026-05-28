import LoadingSpinner from '@/components/LoadingSpinner'

export default function MerchantLoading() {
  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex items-center justify-center">
      <LoadingSpinner text="กำลังโหลด..." />
    </div>
  )
}
