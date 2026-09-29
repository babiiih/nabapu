import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CandlestickChart, TrendingUp, Users, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { fmtEth, fmtPct, shortAddr, timeAgo, toWei } from '@/lib/format'
import TokenImage from '@/features/market/components/TokenImage'
import { ISSUER as DEV } from '@/contracts'

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
  const totalHolders = launches.reduce(
    (a, l) => a + (l.holderCount ?? 0),
    0
  )
  const graduated = launches.filter(
    (l) => l.curve.lifecycle === 'GRADUATED'
  ).length

  const stats = [
    {
      title: 'Tokens launched',
      value: launches.length ? `${launches.length}+` : '—',
      hint: graduated ? `${graduated} graduated` : 'bonding curve',
      icon: CandlestickChart,
    },
    {
      title: '24h volume (ETH)',
      value: loading ? '—' : fmtEth(totalVolume),
      hint: 'across all launches',
      icon: TrendingUp,
    },
    {
      title: 'ETH price',
      value: ethUsd ? `$${ethUsd.toLocaleString()}` : '—',
      hint: 'live oracle quote',
      icon: Wallet,
    },
    {
      title: 'Active holders',
      value: loading ? '—' : `${totalHolders}`,
      hint: 'sum of all curves',
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
        {/* Hero */}
        <div className='hero-panel mb-6 px-6 py-7 relative z-0'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div>
              <span className='chip is-live mb-3'>
                <span
                  className='inline-block h-1.5 w-1.5 rounded-full bg-current'
                  style={{ animation: 'skeleton-pulse 1.6s ease-in-out infinite' }}
                />
                Live on testnet
              </span>
              <h2 className='text-3xl font-bold tracking-tight'>
                Nabapu RWA Index
              </h2>
              <p className='text-muted-foreground mt-1 max-w-[60ch] text-sm'>
                Real-time launches on Robinhood Chain Testnet (vibes protocol).
              </p>
            </div>
            <Link
              to='/market'
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors'
            >
              Browse market →
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.map((s) => (
            <Card key={s.title} className='py-5'>
              <CardHeader className='flex flex-row items-center justify-between gap-2 pb-3'>
                <CardTitle className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  {s.title}
                </CardTitle>
                <span className='stat-icon'>
                  <s.icon className='h-4 w-4' />
                </span>
              </CardHeader>
              <CardContent className='tabular-nums'>
                {loading && s.value === '—' ? (
                  <Skeleton className='h-8 w-24' />
                ) : (
                  <div className='text-2xl font-bold tracking-tight'>
                    {s.value}
                  </div>
                )}
                <div className='text-muted-foreground/80 mt-0.5 text-xs'>
                  {s.hint}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent launches — same token-card language as Market */}
        <div className='mt-6'>
          <div className='mb-3 flex items-baseline justify-between'>
            <h3 className='text-lg font-semibold'>Recent launches</h3>
            <Link
              to='/market'
              className='text-muted-foreground hover:text-foreground text-xs'
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className='market-grid'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={'sk' + i} className='token-card' aria-hidden>
                  <div className='skeleton' style={{ aspectRatio: '1 / 1' }} />
                  <div
                    className='skeleton'
                    style={{ height: '0.875rem', width: '60%' }}
                  />
                  <div
                    className='skeleton'
                    style={{ height: '0.75rem', width: '40%' }}
                  />
                </div>
              ))}
            </div>
          ) : launches.length === 0 ? (
            <div className='text-muted-foreground text-sm'>
              No launches found.
            </div>
          ) : (
            <div className='market-grid'>
              {launches.slice(0, 9).map((l) => (
                <LaunchCard key={l.launchId} launch={l} />
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

function LaunchCard({ launch }: { launch: VibesLaunch }) {
  const grad = launch.curve.lifecycle === 'GRADUATED'
  const pct = Math.min(100, Math.round(launch.curve.progressBps / 100))
  const isDev = launch.creatorAddress.toLowerCase() === DEV.toLowerCase()

  return (
    <Link
      to='/token/$tokenAddress'
      params={{ tokenAddress: launch.tokenAddress }}
      className='token-card'
    >
      <div className='flex items-center gap-3'>
        <div className='h-11 w-11 shrink-0 overflow-hidden rounded-full border'>
          <TokenImage
            uri={launch.content.image?.uri}
            alt={launch.name}
            className='!static h-11 w-11 object-cover'
          />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span className='truncate text-sm font-bold'>
              ${launch.symbol}
            </span>
            {grad && <span className='chip is-live'>Grad</span>}
            {isDev && <span className='chip is-dev'>Dev</span>}
          </div>
          <div className='text-muted-foreground truncate text-xs'>
            {launch.name}
          </div>
        </div>
      </div>

      <div className='curve-track' title={`Curve progress ${pct}%`}>
        <span style={{ width: Math.max(pct, 0.8) + '%' }} />
      </div>

      <div className='text-muted-foreground flex items-center justify-between text-xs'>
        <span>{grad ? 'Graduated' : `${pct}% curve`}</span>
        <span className='tabular-nums'>{launch.holderCount ?? 0} holders</span>
      </div>

      <div className='border-border flex items-center justify-between gap-2 border-t pt-2 text-xs'>
        <span className='text-muted-foreground tabular-nums'>
          {fmtEth(launch.analytics.volume24hWei)} ETH 24h
        </span>
        <span className='text-muted-foreground mono'>
          {shortAddr(launch.tokenAddress)}
        </span>
      </div>
      <div className='text-muted-foreground flex items-center justify-between text-[0.6875rem]'>
        <span className='tabular-nums'>{fmtPct(launch.curve.progressBps)}</span>
        <span>{timeAgo(launch.createdAt)} ago</span>
      </div>
    </Link>
  )
}
