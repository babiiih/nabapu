import {
  LayoutDashboard,
  CandlestickChart,
  Wallet,
  Command,
  Flame,
  Rocket,
  Search,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Connect wallet',
    email: '0x0000…0000',
    avatar: '',
  },
  teams: [
    {
      name: 'Nabapu',
      logo: Command,
      plan: 'RWA Index on Robinhood Chain',
    },
  ],
  navGroups: [
    {
      title: 'Market',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Market',
          url: '/market',
          icon: CandlestickChart,
        },
        {
          title: 'Trending',
          url: '/trending',
          icon: Flame,
        },
        {
          title: 'Trenches',
          url: '/trenches',
          icon: Rocket,
        },
        {
          title: 'Wallet',
          url: '/wallet',
          icon: Search,
        },
        {
          title: 'Profile',
          url: '/profile',
          icon: Wallet,
        },
      ],
    },
  ],
}
