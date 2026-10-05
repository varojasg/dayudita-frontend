import { useEffect, useState } from 'react'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import PageBanner from '../../components/PageBanner'

export default function ClientProfilePage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.getClientAccounts().then(data => setAccounts(data || [])).catch(loadError => setError(loadError.message))
  }, [])

  return (
    <section className="content-page">
      <PageBanner title="Mi perfil" />

      {error && <div className="alert-band">{error}</div>}

      <div className="profile-card-grid">
        <section className="profile-card profile-card-main">
          <h2>Mis datos</h2>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt>Correo</dt><dd>{user.email}</dd></div>
            <div><dt>Cuenta</dt><dd>Cliente</dd></div>
          </dl>
        </section>

        <section className="profile-card profile-card-accent">
          <h2>Mis tiendas</h2>
          <div className="profile-store-list">
            {accounts.map(account => (
              <div className="profile-store" key={account.clientAccountId}>
                <strong>{account.storeName}</strong>
                <span>{account.active ? 'Cuenta activa' : 'Cuenta inactiva'}</span>
                <div>
                  <span>TEA pactada: {(Number(account.teaPactada || 0) * 100).toFixed(2)}%</span>
                  <span>TEA moratoria: {(Number(account.teaMoratoriaPactada || 0) * 100).toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
