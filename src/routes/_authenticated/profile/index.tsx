import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import ProfilePage from '@/features/market/components/ProfilePage'
import Toaster from '@/features/market/components/Toaster'

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <ProfilePage />
      </Main>
      <Toaster />
    </>
  )
}
