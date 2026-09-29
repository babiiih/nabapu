import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import TrendingPage from '@/features/trending/TrendingPage'

export const Route = createFileRoute('/_authenticated/trending/')({
  component: TrendingRoute,
})

function TrendingRoute() {
  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <TrendingPage />
      </Main>
    </>
  )
}
