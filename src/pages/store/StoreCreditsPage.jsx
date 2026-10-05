import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import FrenchScheduleTable from '../../components/FrenchScheduleTable'
import PageBanner from '../../components/PageBanner'

function money(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

function date(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-PE') : '—'
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function codeFor(product) {
  return product.code || `DAYU-${String(product.id).padStart(4, '0')}`
}

const emptyCredit = {
  clientId: '',
  purchaseDate: today(),
  paymentMode: 'INSTALLMENTS',
  porcentajeCuotaInicial: 0,
  numeroMeses: 4,
  items: [{ code: '', quantity: 1 }]
}

export default function StoreCreditsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditForm, setCreditForm] = useState(emptyCredit)
  const [preview, setPreview] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [clientData, productData] = await Promise.all([
        api.getStoreClients(user.storeId),
        api.getStoreProducts(user.storeId)
      ])

      const financeData = await Promise.all(
        clientData.map(async client => {
          const plans = await api.getStoreCreditPlans(user.storeId, client.id)
          return { client, plans }
        })
      )

      setProducts(productData || [])
      setRecords(financeData)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records
      .flatMap(record => record.plans.map(plan => ({ client: record.client, data: plan })))
      .filter(row => {
        if (!query) return true
        const clientText = `${row.client.firstName} ${row.client.lastName} ${row.client.documentNumber}`
        return clientText.toLowerCase().includes(query)
      })
  }, [records, search])

  function openCreditModal() {
    const firstClient = records.find(record => record.client.active)?.client
    setCreditForm({
      ...emptyCredit,
      clientId: firstClient ? String(firstClient.id) : ''
    })
    setPreview(null)
    setPreviewError('')
    setShowCreditModal(true)
  }

  function updateItem(index, field, value) {
    setCreditForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }))
  }

  function addItem() {
    setCreditForm(current => ({
      ...current,
      items: [...current.items, { code: '', quantity: 1 }]
    }))
  }

  function removeItem(index) {
    setCreditForm(current => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  function buildItems() {
    return creditForm.items.map(item => {
      const typedCode = item.code.trim().toUpperCase()
      const product = products.find(candidate => codeFor(candidate).toUpperCase() === typedCode)

      if (!product) {
        throw new Error(`No existe el producto ${item.code || '(sin código)'}`)
      }

      return {
        productId: product.id,
        quantity: Number(item.quantity)
      }
    })
  }

  function buildPurchasePayload() {
    const items = buildItems()

    return {
      clientId: Number(creditForm.clientId),
      purchaseDate: creditForm.purchaseDate,
      paymentMode: creditForm.paymentMode,
      porcentajeCuotaInicial: creditForm.paymentMode === 'INSTALLMENTS'
        ? Number(creditForm.porcentajeCuotaInicial) / 100
        : undefined,
      numeroMeses: creditForm.paymentMode === 'INSTALLMENTS' ? Number(creditForm.numeroMeses) : undefined,
      items
    }
  }

  async function calculatePreview() {
    setPreviewError('')
    setPreview(null)

    try {
      const payload = buildPurchasePayload()
      const plan = await api.simulatePurchase(user.storeId, payload)
      setPreview(plan)
    } catch (calcError) {
      setPreviewError(calcError.message)
    }
  }

  async function createCredit(event) {
    event.preventDefault()
    setError('')

    try {
      const payload = buildPurchasePayload()
      await api.createPurchase(user.storeId, payload)

      setShowCreditModal(false)
      await loadData()
    } catch (createError) {
      setError(createError.message)
    }
  }

  async function registerPayment() {
    try {
      await api.payInstallment(user.storeId, selected.installment.id, paymentDate)
      setSelected(null)
      await loadData()
    } catch (paymentError) {
      setError(paymentError.message)
    }
  }

  const isInstallments = creditForm.paymentMode === 'INSTALLMENTS'

  return (
    <section className="content-page">
      <PageBanner
        title="Créditos"
        actions={
          <button className="primary-button" type="button" onClick={openCreditModal}>
            Nuevo crédito
          </button>
        }
      />

      {error && <div className="alert-band">{error}</div>}

      <div className="page-toolbar">
        <input
          className="search-input"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Buscar cliente..."
        />
      </div>

      {loading && <div className="screen-message compact">Cargando créditos...</div>}

      {!loading && (
        <section className="plain-section no-pad">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Capital</th>
                  <th>Próximo pago</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const next = row.data.installments?.find(item => item.estado === 'PENDING' || item.estado === 'OVERDUE')

                  return (
                    <tr key={row.data.id}>
                      <td>
                        <strong>{row.client.firstName} {row.client.lastName}</strong>
                        <span className="table-subtext">{row.client.documentNumber}</span>
                      </td>
                      <td>{money(row.data.principal)}</td>
                      <td>{next ? `${date(next.dueDate)} · ${money(next.pagoTotal)}` : '—'}</td>
                      <td>{row.data.status === 'PAID' ? 'Pagado' : 'Activo'}</td>
                      <td>
                        <button className="text-button" type="button" onClick={() => setSelected(row)}>Ver</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showCreditModal && (
        <Modal title="Nuevo crédito" onClose={() => setShowCreditModal(false)} wide>
          <form className="credit-create-form" onSubmit={createCredit}>
            <div className="form-grid">
              <label>
                Cliente
                <select
                  value={creditForm.clientId}
                  onChange={event => setCreditForm({ ...creditForm, clientId: event.target.value })}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {records.filter(record => record.client.active).map(record => (
                    <option key={record.client.id} value={record.client.id}>
                      {record.client.firstName} {record.client.lastName} · {record.client.documentNumber}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha de compra
                <input
                  type="date"
                  value={creditForm.purchaseDate}
                  onChange={event => setCreditForm({ ...creditForm, purchaseDate: event.target.value })}
                  required
                />
              </label>

              <label>
                Modalidad
                <select
                  value={creditForm.paymentMode}
                  onChange={event => setCreditForm({ ...creditForm, paymentMode: event.target.value })}
                >
                  <option value="CASH">Al contado</option>
                  <option value="INSTALLMENTS">Cuotas (método francés)</option>
                </select>
              </label>

              {isInstallments && (
                <>
                  <label>
                    % Cuota inicial
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={creditForm.porcentajeCuotaInicial}
                      onChange={event => setCreditForm({ ...creditForm, porcentajeCuotaInicial: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Número de meses
                    <select
                      value={creditForm.numeroMeses}
                      onChange={event => setCreditForm({ ...creditForm, numeroMeses: event.target.value })}
                    >
                      {[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="credit-items">
              <h2>Productos</h2>
              {creditForm.items.map((item, index) => (
                <div className="credit-item-row" key={index}>
                  <label>
                    Código
                    <input
                      value={item.code}
                      onChange={event => updateItem(index, 'code', event.target.value)}
                      placeholder="DAYU-0001"
                      required
                    />
                  </label>
                  <label>
                    Cantidad
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={event => updateItem(index, 'quantity', event.target.value)}
                      required
                    />
                  </label>
                  {creditForm.items.length > 1 && (
                    <button className="text-button" type="button" onClick={() => removeItem(index)}>
                      Quitar
                    </button>
                  )}
                </div>
              ))}
              <button className="secondary-button" type="button" onClick={addItem}>
                Agregar producto
              </button>
            </div>

            {isInstallments && (
              <div className="credit-preview">
                <div className="form-actions">
                  <button className="secondary-button" type="button" onClick={calculatePreview}>
                    Calcular cronograma
                  </button>
                </div>

                {previewError && <div className="alert-band">{previewError}</div>}

                {preview && (
                  <>
                    <div className="credit-detail-line">
                      <span>Cuota inicial</span>
                      <strong>{money(preview.cuotaInicial)}</strong>
                      <span>Capital financiado {money(preview.principal)}</span>
                      <span>Total a pagar {money(preview.totalAPagar)}</span>
                    </div>
                    <FrenchScheduleTable plan={preview} />
                  </>
                )}
              </div>
            )}

            <div className="form-actions">
              <button className="primary-button" type="submit">Registrar crédito</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal
          title={`${selected.client.firstName} ${selected.client.lastName}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="credit-detail">
            <FrenchScheduleTable
              plan={selected.data}
              showPaymentAction
              onPay={installment => setSelected({ ...selected, installment })}
            />
            {selected.installment && (
              <PaymentBox
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
                onPay={registerPayment}
                label={`Pagar cuota ${selected.installment.installmentNumber} · ${money(selected.installment.pagoTotal)}`}
              />
            )}
          </div>
        </Modal>
      )}
    </section>
  )
}

function PaymentBox({ paymentDate, setPaymentDate, onPay, label }) {
  return (
    <div className="payment-box">
      <label>
        Fecha de pago
        <input
          type="date"
          value={paymentDate}
          onChange={event => setPaymentDate(event.target.value)}
        />
      </label>
      <button className="primary-button" type="button" onClick={onPay}>{label}</button>
    </div>
  )
}
