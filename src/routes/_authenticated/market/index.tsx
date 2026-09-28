import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import MarketPage from '@/features/market/components/MarketPage'
import Toaster from '@/features/market/components/Toaster'

export const Route = createFileRoute('/_authenticated/market/')({
  component: MarketRoute,
})

function MarketRoute() {
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <MarketPage />
      </Main>
      <Toaster />
    </>
  )
}
