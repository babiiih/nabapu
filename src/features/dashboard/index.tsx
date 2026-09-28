import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CandlestickChart, TrendingUp, Users, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  listLaunches,
  quoteUsdRates,
  type VibesLaunch,
} from '@/lib/vibes'
import { fmtEth, fmtPct, shortAddr, toWei } from '@/lib/format'
import TokenImage from '@/features/market/components/TokenImage'

const topNav = [
  { title: 'Overview', href: '/', isActive: true, disabled: false },
  { title: 'Market', href: '/market', isActive: false, disabled: false },
  { title: 'Profile', href: '/profile', isActive: false, disabled: false },
]

export function Dashboard() {
  const [launches, setLaunches] = useState<VibesLaunch[]>([])
  const [ethUsd, setEthUsd] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [res, rates] = await Promise.all([
          listLaunches({ limit: 24 }),
          quoteUsdRates().catch(() => null),
        ])
        if (cancelled) return
        setLaunches(res.items)
        // rates are cents per ETH
        const r = rates?.[0]
        setEthUsd(r ? Number(r.usdPerQuoteCents) / 100 : null)
      } catch {
        // network errors are surfaced by the empty state
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalVolume = launches.reduce(
    (acc, l) => acc + toWei(l.analytics.volume24hWei),
    0n
  )

  const stats = [
    {
      title: 'Tokens launched',
      value: launches.length ? `${launches.length}+` : '—',
      icon: CandlestickChart,
    },
    {
      title: '24h volume (ETH)',
      value: loading ? '—' : fmtEth(totalVolume),
      icon: TrendingUp,
    },
    {
      title: 'ETH price',
      value: ethUsd ? `$${ethUsd.toLocaleString()}` : '—',
      icon: Wallet,
    },
    {
      title: 'Active holders',
      value: `${launches.reduce((a, l) => a + (l.holderCount ?? 0), 0)}`,
      icon: Users,
    },
  ]

  return (
    <>
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Nabapu RWA Index
          </h2>
          <p className='text-muted-foreground text-sm'>
            Real-time launches on Robinhood Chain Testnet (vibes protocol).
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.map((s) => (
            <Card key={s.title}>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {s.title}
                </CardTitle>
                <s.icon className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='mt-6'>
          <h3 className='mb-3 text-lg font-semibold'>Recent launches</h3>
          {loading ? (
            <div className='text-muted-foreground text-sm'>Loading launches…</div>
          ) : launches.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No launches found.
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {launches.slice(0, 9).map((l) => (
                <Card key={l.launchId} className='overflow-hidden'>
                  <CardHeader className='flex flex-row items-center gap-3 pb-2'>
                    <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full border'>
                      <TokenImage
                        uri={l.content.image?.uri}
                        alt={l.name}
                        className='!static h-10 w-10 object-cover'
                      />
                    </div>
                    <div className='min-w-0'>
                      <CardTitle className='truncate text-sm'>
                        ${l.symbol}
                      </CardTitle>
                      <p className='truncate text-muted-foreground text-xs'>
                        {shortAddr(l.creatorAddress)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Holders</span>
                      <span>{l.holderCount ?? 0}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Curve</span>
                      <span>{fmtPct(l.curve.progressBps)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>24h vol</span>
                      <span>{fmtEth(l.analytics.volume24hWei)} ETH</span>
                    </div>
                    <Link
                      to='/token/$tokenAddress'
                      params={{ tokenAddress: l.tokenAddress }}
                      className='text-primary hover:underline mt-2 inline-block text-sm font-medium'
                    >
                      View token →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
