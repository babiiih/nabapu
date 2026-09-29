import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import NftPage from '@/features/nft/NftPage'

export const Route = createFileRoute('/_authenticated/nft/')({
  component: NftRoute,
})

function NftRoute() {
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <NftPage />
      </Main>
    </>
  )
}
