import { DisabledFeatureModal } from "@/components/disabled-feature-modal"

export default function OdontoflixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DisabledFeatureModal feature="odontoflix" />
      {children}
    </>
  )
}
