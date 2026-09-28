import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { shortAddr } from '@/lib/format'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export function ProfileDropdown() {
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { connectors, connect } = useConnect()
  const [pickWallet, setPickWallet] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('nabapu:label') ?? ''
    } catch {
      return ''
    }
  })

  const label = name.trim() || (address ? shortAddr(address) : 'Connect wallet')
  const initials = address ? address.slice(2, 4).toUpperCase() : 'NB'

  const saveLabel = () => {
    try {
      localStorage.setItem('nabapu:label', name.trim())
    } catch {
      /* ignore */
    }
    setRenaming(false)
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{label}</p>
              <p className='text-xs leading-none text-muted-foreground'>
                {isConnected
                  ? `${connector?.name ?? 'Wallet'} · ${shortAddr(address!)}`
                  : 'No wallet connected'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isConnected ? (
            <DropdownMenuItem onClick={() => setPickWallet(true)}>
              Connect wallet
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setRenaming(true)}>
              Rename wallet label
            </DropdownMenuItem>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/profile'>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/market'>
                Market
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {isConnected && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => disconnect()}
              >
                <LogOut />
                Disconnect
                <DropdownMenuShortcut className='text-current'>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {pickWallet && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={() => setPickWallet(false)}
        >
          <div
            className='w-full max-w-sm space-y-2 rounded-md border border-border bg-card p-4 text-left'
            onClick={(e) => e.stopPropagation()}
          >
            <p className='text-sm font-medium'>Choose a wallet</p>
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => {
                  connect({ connector: c })
                  setPickWallet(false)
                }}
                className='flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted'
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setPickWallet(false)}
              className='w-full pt-1 text-xs text-muted-foreground hover:text-foreground'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {renaming && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={saveLabel}
        >
          <div
            className='w-full max-w-sm space-y-3 rounded-md border border-border bg-card p-4 text-left'
            onClick={(e) => e.stopPropagation()}
          >
            <p className='text-sm font-medium'>Rename wallet label</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={address ? shortAddr(address) : 'My wallet'}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel()
              }}
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={saveLabel}
                className='rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted'
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
