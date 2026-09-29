import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import WalletPage from '@/features/wallet/WalletPage'

export const Route = createFileRoute('/_authenticated/wallet/')({
  component: WalletRoute,
})

function WalletRoute() {
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <WalletPage />
      </Main>
    </>
  )
}
