// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { AuthContextData } from '../contexts/AuthContext'

interface MyRouterContext {
  auth: AuthContextData
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
})