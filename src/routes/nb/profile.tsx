import { createFileRoute } from '@tanstack/react-router'
import { NbProfile } from '@/components/nabapu-ui/pages/profile'

export const Route = createFileRoute('/nb/profile')({
  component: NbProfile,
})
