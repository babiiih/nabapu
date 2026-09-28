import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import TokenPage from '@/features/market/components/TokenPage'

export const Route = createFileRoute('/_authenticated/token/$tokenAddress')({
  component: TokenRoute,
})

function TokenRoute() {
  const { tokenAddress } = Route.useParams()
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <TokenPage address={tokenAddress as `0x${string}`} />
      </Main>
    </>
  )
}
