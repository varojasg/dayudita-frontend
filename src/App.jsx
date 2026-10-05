import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import ClientProductsPage from './pages/client/ClientProductsPage'
import ClientCreditsPage from './pages/client/ClientCreditsPage'
import ClientProfilePage from './pages/client/ClientProfilePage'
import StoreClientsPage from './pages/store/StoreClientsPage'
import StoreCreditsPage from './pages/store/StoreCreditsPage'
import StoreCreditPolicyPage from './pages/store/StoreCreditPolicyPage'
import StoreProfilePage from './pages/store/StoreProfilePage'
import SystemStoresPage from './pages/system/SystemStoresPage'
import SystemProfilePage from './pages/system/SystemProfilePage'

function homeForRole(role) {
  if (role === 'CLIENT') return '/client/products'
  if (role === 'STORE_ADMIN') return '/store/clients'
  if (role === 'SYSTEM_ADMIN') return '/system/stores'
  return '/login'
}

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="screen-message">Cargando Dayudita...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  return children
}

function RoleHome() {
  const { user, loading } = useAuth()

  if (loading) return <div className="screen-message">Cargando Dayudita...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleHome />} />

      <Route element={<ProtectedRoute role="CLIENT"><AppLayout /></ProtectedRoute>}>
        <Route path="/client/products" element={<ClientProductsPage />} />
        <Route path="/client/credits" element={<ClientCreditsPage />} />
        <Route path="/client/profile" element={<ClientProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute role="STORE_ADMIN"><AppLayout /></ProtectedRoute>}>
        <Route path="/store/clients" element={<StoreClientsPage />} />
        <Route path="/store/credits" element={<StoreCreditsPage />} />
        <Route path="/store/credit-policy" element={<StoreCreditPolicyPage />} />
        <Route path="/store/profile" element={<StoreProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute role="SYSTEM_ADMIN"><AppLayout /></ProtectedRoute>}>
        <Route path="/system/stores" element={<SystemStoresPage />} />
        <Route path="/system/profile" element={<SystemProfilePage />} />
      </Route>

      <Route path="*" element={<RoleHome />} />
    </Routes>
  )
}
