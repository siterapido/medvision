import { DisabledFeatureModal } from "@/components/disabled-feature-modal"

export default function CertificadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DisabledFeatureModal feature="certificados" />
      {children}
    </>
  )
}
