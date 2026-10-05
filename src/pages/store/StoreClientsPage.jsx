import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import PageBanner from '../../components/PageBanner'

// Fijada por el sistema (dayudita.tea-moratoria en el backend); no es editable.
const TEA_MORATORIA_FIJA = 12

const emptyClient = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  email: '',
  password: '',
  phone: '',
  teaPactada: 20,
  currency: 'PEN',
  limiteCredito: 500,
  plazoMaximoMeses: 4,
  diaCorte: 15
}

function asPercent(value) {
  return Number((Number(value || 0) * 100).toFixed(4))
}

function asDecimal(value) {
  return Number(value || 0) / 100
}

export default function StoreClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [lookupDocument, setLookupDocument] = useState('')
  const [foundClient, setFoundClient] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadClients() {
    try {
      setClients(await api.getStoreClients(user.storeId))
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => { loadClients() }, [])

  const visibleClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clients

    return clients.filter(client => {
      const clientText = `${client.firstName} ${client.lastName} ${client.documentNumber} ${client.email}`
      return clientText.toLowerCase().includes(query)
    })
  }, [clients, search])

  function openCreate() {
    setForm(emptyClient)
    setModal('create')
  }

  function openAssociate() {
    setForm(emptyClient)
    setModal('associate')
    setFoundClient(null)
    setLookupDocument('')
  }

  function openEdit(client) {
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone || '',
      teaPactada: asPercent(client.teaPactada),
      currency: client.currency,
      limiteCredito: client.limiteCredito,
      plazoMaximoMeses: client.plazoMaximoMeses,
      diaCorte: client.diaCorte
    })
    setFoundClient(client)
    setModal('edit')
  }

  async function saveClient(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      teaPactada: asDecimal(form.teaPactada),
      limiteCredito: Number(form.limiteCredito),
      plazoMaximoMeses: Number(form.plazoMaximoMeses),
      diaCorte: Number(form.diaCorte)
    }

    try {
      if (modal === 'create') {
        await api.createClient(user.storeId, payload)
        setNotice('Cliente registrado correctamente.')
      } else {
        await api.updateClient(user.storeId, foundClient.id, payload)
        setNotice('Datos del cliente actualizados.')
      }

      setModal(null)
      await loadClients()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(client) {
    try {
      await api.updateClientStatus(user.storeId, client.id, !client.active)
      await loadClients()
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  async function lookupExisting(event) {
    event.preventDefault()
    setFoundClient(null)
    setError('')

    try {
      setFoundClient(await api.lookupClient(user.storeId, lookupDocument))
    } catch (lookupError) {
      setError(lookupError.message)
    }
  }

  async function associateExisting(event) {
    event.preventDefault()

    try {
      await api.associateClient(user.storeId, foundClient.id, {
        teaPactada: asDecimal(form.teaPactada),
        currency: form.currency,
        limiteCredito: Number(form.limiteCredito),
        plazoMaximoMeses: Number(form.plazoMaximoMeses),
        diaCorte: Number(form.diaCorte)
      })
      setModal(null)
      setNotice('Cliente asociado a la tienda.')
      await loadClients()
    } catch (associateError) {
      setError(associateError.message)
    }
  }

  return (
    <section className="content-page">
      <PageBanner
        title="Clientes"
        actions={
          <div className="heading-actions">
            <button className="secondary-button" type="button" onClick={openAssociate}>Asociar existente</button>
            <button className="primary-button" type="button" onClick={openCreate}>Nuevo cliente</button>
          </div>
        }
      />

      {error && <div className="alert-band">{error}</div>}
      {notice && <div className="success-band">{notice}</div>}

      <div className="page-toolbar">
        <input
          className="search-input"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Buscar por nombre, DNI o correo..."
        />
      </div>

      <section className="paper-section no-pad">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>TEA pactada</th>
                <th>TEA moratoria</th>
                <th>Moneda</th>
                <th>Límite</th>
                <th>Plazo máx.</th>
                <th>Día corte</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map(client => (
                <tr key={client.clientAccountId}>
                  <td>
                    <strong>{client.firstName} {client.lastName}</strong>
                    <span className="table-subtext">{client.email}</span>
                  </td>
                  <td>{client.documentNumber}</td>
                  <td>{client.phone || '—'}</td>
                  <td>{asPercent(client.teaPactada)}%</td>
                  <td>{asPercent(client.teaMoratoriaPactada)}%</td>
                  <td>{client.currency}</td>
                  <td>{client.limiteCredito}</td>
                  <td>{client.plazoMaximoMeses}</td>
                  <td>{client.diaCorte}</td>
                  <td>
                    <span className={`status-tag ${client.active ? 'paid' : 'inactive'}`}>
                      {client.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="text-button" type="button" onClick={() => openEdit(client)}>Editar</button>
                    <button className="text-button" type="button" onClick={() => toggleStatus(client)}>
                      {client.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'}
          onClose={() => setModal(null)}
          wide
        >
          <form className="form-grid" onSubmit={saveClient}>
            <label>
              Nombre
              <input
                value={form.firstName}
                onChange={event => setForm({ ...form, firstName: event.target.value })}
                required
              />
            </label>
            <label>
              Apellido
              <input
                value={form.lastName}
                onChange={event => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </label>

            {modal === 'create' && (
              <label>
                Documento
                <input
                  value={form.documentNumber}
                  onChange={event => setForm({ ...form, documentNumber: event.target.value })}
                  required
                />
              </label>
            )}
            {modal === 'create' && (
              <label>
                Correo
                <input
                  type="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>
            )}
            {modal === 'create' && (
              <label>
                Contraseña
                <input
                  type="password"
                  minLength="6"
                  value={form.password}
                  onChange={event => setForm({ ...form, password: event.target.value })}
                  required
                />
              </label>
            )}

            <label>
              Teléfono
              <input
                value={form.phone || ''}
                onChange={event => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label>
              TEA pactada (%)
              <input
                type="number"
                min="0"
                step="0.0001"
                value={form.teaPactada}
                onChange={event => setForm({ ...form, teaPactada: event.target.value })}
                required
              />
            </label>
            <label>
              TEA moratoria pactada (%)
              <input
                type="number"
                min="0"
                step="0.0001"
                value={TEA_MORATORIA_FIJA}
                readOnly
              />
            </label>
            <label>
              Moneda del crédito
              <select
                value={form.currency}
                onChange={event => setForm({ ...form, currency: event.target.value })}
                required
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </label>
            <label>
              Límite de crédito
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.limiteCredito}
                onChange={event => setForm({ ...form, limiteCredito: event.target.value })}
                required
              />
            </label>
            <label>
              Plazo máximo (meses)
              <input
                type="number"
                min="1"
                step="1"
                value={form.plazoMaximoMeses}
                onChange={event => setForm({ ...form, plazoMaximoMeses: event.target.value })}
                required
              />
            </label>
            <label>
              Día de corte (1-31)
              <input
                type="number"
                min="1"
                max="31"
                step="1"
                value={form.diaCorte}
                onChange={event => setForm({ ...form, diaCorte: event.target.value })}
                required
              />
            </label>

            <div className="form-actions full-span">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'associate' && (
        <Modal title="Asociar cliente existente" onClose={() => setModal(null)}>
          <form className="stack-form" onSubmit={lookupExisting}>
            <label>
              Documento del cliente
              <input
                value={lookupDocument}
                onChange={event => setLookupDocument(event.target.value)}
                required
              />
            </label>
            <button className="secondary-button" type="submit">Buscar</button>
          </form>

          {foundClient && (
            <form className="associate-result" onSubmit={associateExisting}>
              <div>
                <strong>{foundClient.firstName} {foundClient.lastName}</strong>
                <span>{foundClient.email}</span>
              </div>

              {foundClient.alreadyAssociated ? (
                <div className="alert-band">Este cliente ya está asociado a la tienda.</div>
              ) : (
                <>
                  <label>
                    TEA pactada (%)
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={form.teaPactada}
                      onChange={event => setForm({ ...form, teaPactada: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    TEA moratoria pactada (%)
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={TEA_MORATORIA_FIJA}
                      readOnly
                    />
                  </label>
                  <label>
                    Moneda del crédito
                    <select
                      value={form.currency}
                      onChange={event => setForm({ ...form, currency: event.target.value })}
                      required
                    >
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </label>
                  <label>
                    Límite de crédito
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.limiteCredito}
                      onChange={event => setForm({ ...form, limiteCredito: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Plazo máximo (meses)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.plazoMaximoMeses}
                      onChange={event => setForm({ ...form, plazoMaximoMeses: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Día de corte (1-31)
                    <input
                      type="number"
                      min="1"
                      max="31"
                      step="1"
                      value={form.diaCorte}
                      onChange={event => setForm({ ...form, diaCorte: event.target.value })}
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit">Asociar a mi tienda</button>
                </>
              )}
            </form>
          )}
        </Modal>
      )}
    </section>
  )
}
