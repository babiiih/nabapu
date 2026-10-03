import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NabapuShell } from '@/components/nabapu-ui/shell'
import { NbConnectListener } from '@/components/nabapu-ui/connect-listener'

export const Route = createFileRoute('/nb')({
  component: NbLayout,
})

function NbLayout() {
  return (
    <NabapuShell>
      <NbConnectListener />
      <Outlet />
    </NabapuShell>
  )
}
