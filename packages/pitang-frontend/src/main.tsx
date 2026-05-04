import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/use-auth'
import './index.css'

import { NotFound } from './components/not-found'

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
  context: {
    auth: undefined!,
  }
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


function InnerApp() {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <InnerApp />
    <Toaster />
  </AuthProvider>
)