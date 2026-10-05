import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/dayudita-logo.png'
import bunny from '../assets/bunny-login.png'
import starPair from '../assets/star-red-pair.png'
import starRays from '../assets/star-rays.png'
import starPink from '../assets/star-pink.png'
import starsGroup from '../assets/stars-red-group.png'

function destination(role) {
  if (role === 'CLIENT') return '/client/products'
  if (role === 'STORE_ADMIN') return '/store/clients'
  if (role === 'SYSTEM_ADMIN') return '/system/stores'
  return '/login'
}

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setError(''), [email, password])

  if (!loading && user) {
    return <Navigate to={destination(user.role)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const authenticatedUser = await login(email.trim(), password)
      navigate(destination(authenticatedUser.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <img className="login-logo" src={logo} alt="Dayudita Piñatería" />
        <img className="login-bunny" src={bunny} alt="Conejito Dayudita" />
        <img className="login-deco login-deco-one" src={starPair} alt="" aria-hidden="true" />
        <img className="login-deco login-deco-two" src={starRays} alt="" aria-hidden="true" />
        <img className="login-deco login-deco-three" src={starPink} alt="" aria-hidden="true" />
        <p className="login-phrase">Más momentos bonitos ♡</p>
      </section>

      <section className="login-form-panel">
        <img className="login-form-stars" src={starsGroup} alt="" aria-hidden="true" />
        <form className="login-form-wrap" onSubmit={handleSubmit}>
          <div className="login-intro">
            <h1>¡Hola de nuevo!</h1>
            <p>Bienvenid@ a la piñatería Dayu</p>
          </div>

          <label>
            USUARIO
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="correo@dayudita.pe"
              autoComplete="email"
              required
            />
          </label>

          <label>
            CONTRASEÑA
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button login-button" disabled={submitting}>
            {submitting ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>
      </section>
    </main>
  )
}
