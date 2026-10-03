import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/nb/')({
  beforeLoad: () => {
    throw redirect({ to: '/nb/dashboard' })
  },
})
