import { createFileRoute } from '@tanstack/react-router'
import { NbMarket } from '@/components/nabapu-ui/pages/market'

export const Route = createFileRoute('/nb/market')({
  component: NbMarket,
})
