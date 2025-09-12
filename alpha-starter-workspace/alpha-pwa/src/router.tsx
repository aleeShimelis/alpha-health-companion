import VitalsPage from './pages/VitalsPage'
import Symptoms from './pages/SymptomsPage'
import MedicationDecoderPage from './pages/MedicationDecoderPage'
import GoalsPage from './pages/GoalsPage'
import ReportsPage from './pages/ReportsPage'
import ConsentPage from './pages/ConsentPage'
import CyclesPage from './pages/CyclesPage'
import SymptomAnalysisPage from './pages/SymptomAnalysisPage'


import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { AuthProvider, useAuth } from './auth/AuthContext'

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/vitals" element={<Protected><VitalsPage /></Protected>} />
        <Route path="/symptoms" element={<Protected><Symptoms /></Protected>} />
        <Route path="/meds/decoder" element={<Protected><MedicationDecoderPage /></Protected>} />
        <Route path="/goals" element={<Protected><GoalsPage /></Protected>} />
        <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
        <Route path="/consent" element={<Protected><ConsentPage /></Protected>} />
        <Route path="/cycles" element={<Protected><CyclesPage /></Protected>} />
        <Route path="/symptoms/analyze" element={<Protected><SymptomAnalysisPage /></Protected>} />

      </Routes>
    </AuthProvider>
  )
}
