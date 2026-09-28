import {
  LayoutDashboard,
  CandlestickChart,
  Wallet,
  Command,
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
          title: 'Profile',
          url: '/profile',
          icon: Wallet,
        },
      ],
    },
  ],
}
