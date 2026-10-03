import { createFileRoute } from '@tanstack/react-router'
import { NbDashboard } from '@/components/nabapu-ui/pages/dashboard'

export const Route = createFileRoute('/nb/dashboard')({
  component: NbDashboard,
})
