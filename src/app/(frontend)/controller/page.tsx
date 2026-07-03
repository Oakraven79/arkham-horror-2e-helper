import { ControllerClient } from './ControllerClient'

interface ControllerPageProps {
  searchParams: Promise<{
    secret?: string | string[]
    session?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ControllerPage({ searchParams }: ControllerPageProps) {
  const params = await searchParams

  return (
    <ControllerClient
      joinSecret={firstValue(params.secret)}
      sessionID={firstValue(params.session)}
    />
  )
}
