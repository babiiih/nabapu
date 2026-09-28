import { cn } from '@/lib/utils'

type FooterProps = React.ComponentProps<'footer'>

export function Footer({ className, ...props }: FooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer
      className={cn(
        'text-muted-foreground mt-auto shrink-0 border-t px-4 py-4 text-center text-sm',
        className
      )}
      {...props}
    >
      <div className='flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6'>
        <span>&copy; {year} Nabapu — RWA marketplace on Robinhood Chain Testnet</span>
        <div className='flex items-center gap-4'>
          <a
            href='https://x.com/nabapu13'
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 transition-colors hover:text-foreground'
          >
            <svg viewBox='0 0 24 24' className='size-3.5' fill='currentColor' aria-hidden>
              <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
            </svg>
            @nabapu13
          </a>
          <a
            href='https://discord.gg/nabapu'
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 transition-colors hover:text-foreground'
          >
            <svg viewBox='0 0 24 24' className='size-4' fill='currentColor' aria-hidden>
              <path d='M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
            </svg>
            Discord
          </a>
          <a
            href='mailto:naufalbaliputraa@gmail.com'
            className='inline-flex items-center gap-1.5 transition-colors hover:text-foreground'
          >
            <svg viewBox='0 0 24 24' className='size-4' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
              <rect width='20' height='16' x='2' y='4' rx='2' />
              <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
            </svg>
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
