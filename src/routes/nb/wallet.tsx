import { createFileRoute } from '@tanstack/react-router'
import { NbWallet } from '@/components/nabapu-ui/pages/wallet'

export const Route = createFileRoute('/nb/wallet')({
  component: NbWallet,
})
