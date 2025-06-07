import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UserInfo from './pages/UserInfo'
import EmployeePage from './pages/Employee'
import NotFound from './pages/NotFound'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user-info" element={<UserInfo />} />
        <Route path="employees" element={<EmployeePage />} />
      </Route>

      {/* Redirect base path to /admin/dashboard if authenticated, else to /login */}
      <Route path="/" element={
          isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App