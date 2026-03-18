import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppShell from "@/components/layout/AppShell"
import TemplatesPage from "@/pages/TemplatesPage"
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/templates" replace /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "instances", element: <InstancesPage /> },
      { path: "instances/:id", element: <InstanceDetailPage /> },
      { path: "settled", element: <SettledPage /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
