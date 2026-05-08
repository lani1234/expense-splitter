import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import AppShell from "@/components/layout/AppShell"
import LoginPage from "@/pages/LoginPage"
import TemplatesPage from "@/pages/TemplatesPage"
import TemplateDetailPage from "@/pages/TemplateDetailPage"
import InstancesPage from "@/pages/InstancesPage"
import InstanceDetailPage from "@/pages/InstanceDetailPage"
import SettledPage from "@/pages/SettledPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/templates" replace /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "templates/:templateId", element: <TemplateDetailPage /> },
      { path: "instances", element: <InstancesPage /> },
      { path: "instances/:id", element: <InstanceDetailPage /> },
      { path: "settled", element: <SettledPage /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
