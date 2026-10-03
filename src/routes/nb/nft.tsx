import { createFileRoute } from '@tanstack/react-router'
import { NbNft } from '@/components/nabapu-ui/pages/nft'

export const Route = createFileRoute('/nb/nft')({
  component: NbNft,
})
