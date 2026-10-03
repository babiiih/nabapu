import { createFileRoute } from '@tanstack/react-router'
import { NbTrending } from '@/components/nabapu-ui/pages/trending'

export const Route = createFileRoute('/nb/trending')({
  component: NbTrending,
})
