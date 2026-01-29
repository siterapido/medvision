import { DisabledFeatureModal } from "@/components/disabled-feature-modal"

export default function BibliotecaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DisabledFeatureModal feature="biblioteca" />
      {children}
    </>
  )
}
