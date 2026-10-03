import { createFileRoute } from '@tanstack/react-router'
import { NbTrenches } from '@/components/nabapu-ui/pages/trenches'

export const Route = createFileRoute('/nb/trenches')({
  component: NbTrenches,
})
