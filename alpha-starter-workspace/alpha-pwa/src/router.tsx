import VitalsPage from './pages/VitalsPage'
import Symptoms from './pages/SymptomsPage'
import MedicationDecoderPage from './pages/MedicationDecoderPage'
import GoalsPage from './pages/GoalsPage'
import ReportsPage from './pages/ReportsPage'
import ConsentPage from './pages/ConsentPage'
import CyclesPage from './pages/CyclesPage'
import SymptomAnalysisPage from './pages/SymptomAnalysisPage'
import RemindersPage from './pages/RemindersPage'


import { Navigate, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import ErrorPage from './components/ErrorPage'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { AuthProvider, useAuth } from './auth/AuthContext'
import RefreshBanner from './components/RefreshBanner'
import { ToastProvider } from './components/Toasts'
import AppShell from './components/AppShell'

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <AppShell>{children}</AppShell>
}

function Root(){
  return (
    <AuthProvider>
      <ToastProvider>
        <RefreshBanner />
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Root />, errorElement: <ErrorPage />, children: [
    { index: true, element: <Navigate to="/dashboard" replace /> },
    { path: 'login', element: <Login /> },
    { path: 'register', element: <Register /> },
    { path: 'dashboard', element: <Protected><Dashboard /></Protected> },
    { path: 'profile', element: <Protected><Profile /></Protected> },
    { path: 'vitals', element: <Protected><VitalsPage /></Protected> },
    { path: 'symptoms', element: <Protected><Symptoms /></Protected> },
    { path: 'symptoms/analyze', element: <Protected><SymptomAnalysisPage /></Protected> },
    { path: 'meds/decoder', element: <Protected><MedicationDecoderPage /></Protected> },
    { path: 'goals', element: <Protected><GoalsPage /></Protected> },
    { path: 'reports', element: <Protected><ReportsPage /></Protected> },
    { path: 'consent', element: <Protected><ConsentPage /></Protected> },
    { path: 'cycles', element: <Protected><CyclesPage /></Protected> },
    { path: 'reminders', element: <Protected><RemindersPage /></Protected> },
    { path: '*', element: <NotFound /> },
  ]}
], {
  future: { v7_startTransition: true }
})

export default function AppRouter(){
  return <RouterProvider router={router} />
}
