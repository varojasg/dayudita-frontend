import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

function hasActiveCredit(record) {
  return record.plans.some(plan => plan.status === 'ACTIVE')
}

function friendlyCreditError(error, policy, client, principal) {
  const original = String(error?.message || error || '')
  const message = original.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  if (message.includes('fuera del rango permitido')) {
    const minimum = Number(policy?.capitalMinimo)
    const maximum = Number(policy?.capitalMaximo)
    if (Number.isFinite(principal) && policy && principal < minimum) {
      return `El monto a financiar es ${money(principal)}. Para pedir un crédito necesitas al menos ${money(minimum)}. Agrega más productos o reduce la cuota inicial.`
    }
    if (Number.isFinite(principal) && policy && principal > maximum) {
      return `El monto a financiar es ${money(principal)}, pero el máximo permitido es ${money(maximum)}. Reduce la cantidad de productos o aumenta la cuota inicial.`
    }
    return policy
      ? `El monto financiado debe estar entre ${money(minimum)} y ${money(maximum)}. Revisa los productos y la cuota inicial.`
      : 'El monto del crédito no está dentro de lo permitido por la tienda. Revisa la política de crédito.'
  }
  if (message.includes('limite de credito')) {
    return client
      ? `Este cliente tiene un límite de crédito de ${money(client.limiteCredito)}. Reduce el monto a financiar para continuar.`
      : 'El monto solicitado supera el límite de crédito del cliente. Reduce el importe para continuar.'
  }
  if (message.includes('tea pactada')) {
    return 'La tasa de interés anual del cliente no está dentro de lo permitido por la tienda. Revisa su configuración en Clientes.'
  }
  if (message.includes('plazo maximo') || message.includes('numero de meses supera')) {
    return client
      ? `Este cliente puede pagar como máximo en ${client.plazoMaximoMeses} meses. Elige un plazo más corto.`
      : 'El plazo seleccionado supera el máximo permitido para este cliente. Elige menos meses.'
  }
  if (message.includes('credito en cuotas activo')) {
    return 'Este cliente ya tiene un crédito activo. Debe terminar de pagarlo antes de solicitar otro.'
  }
  if (message.includes('inactivo') || message.includes('no se encuentra asociado')) {
    return 'Este cliente no está habilitado para comprar en esta tienda. Selecciona otro cliente.'
  }
  if (message.includes('no permite pago en cuotas') || message.includes('producto se encuentra inactivo')) {
    return 'Uno de los productos seleccionados no está disponible para pagos en cuotas. Elige otro producto.'
  }
  if (message.includes('producto no puede repetirse')) {
    return 'Agregaste el mismo producto más de una vez. Cambia la cantidad en una sola fila.'
  }
  if (message.includes('no pertenece a esta tienda')) {
    return 'Uno de los productos ya no está disponible en esta tienda. Actualiza el formulario y elige otro.'
  }
  if (message.includes('politica de credito')) {
    return 'Esta tienda todavía no tiene una política de crédito configurada. Configúrala antes de continuar.'
  }
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network request failed')) {
    return 'No pudimos conectarnos con Dayudita. Verifica que la aplicación esté funcionando e inténtalo nuevamente.'
  }
  if (message.includes('401') || message.includes('unauthorized') || message.includes('sesion')) {
    return 'Tu sesión terminó. Vuelve a iniciar sesión para continuar.'
  }
  if (message.includes('403') || message.includes('forbidden') || message.includes('access denied')) {
    return 'Tu cuenta no tiene permiso para realizar esta operación.'
  }
  if (message.includes('formato valido') || message.includes('invalid json')) {
    return 'Revisa los datos ingresados e inténtalo nuevamente.'
  }
  return original && !/(exception|stack|java\.|org\.|nullpointer|500)/i.test(original)
    ? original
    : 'No pudimos completar la operación. Revisa los datos e inténtalo nuevamente.'
}

const emptyCredit = {
  clientId: '',
  purchaseDate: today(),
  paymentMode: 'INSTALLMENTS',
  porcentajeCuotaInicial: 0,
  numeroMeses: 4,
  items: [{ productId: '', quantity: 1 }]
}

export default function StoreCreditsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { planId } = useParams()
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [creditPolicy, setCreditPolicy] = useState(null)
  const [openingCredit, setOpeningCredit] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [paidPurchase, setPaidPurchase] = useState(null)
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
      const [clientData, productData, policyData] = await Promise.all([
        api.getStoreClients(user.storeId),
        api.getStoreProducts(user.storeId),
        api.getStoreCreditPolicy(user.storeId).catch(() => null)
      ])

      const financeData = await Promise.all(
        clientData.map(async client => {
          const plans = await api.getStoreCreditPlans(user.storeId, client.id)
          return { client, plans }
        })
      )

      setProducts(productData || [])
      setCreditPolicy(policyData)
      setRecords(financeData)
      return { financeData, policyData }
    } catch (loadError) {
      setError(friendlyCreditError(loadError))
      return null
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

  useEffect(() => {
    if (!planId) {
      setSelected(null)
      return
    }

    const found = records.flatMap(record =>
      record.plans.map(plan => ({ client: record.client, data: plan }))
    ).find(row => String(row.data.id) === planId)
    setSelected(found || null)
  }, [planId, records])

  const isInstallments = creditForm.paymentMode === 'INSTALLMENTS'
  const availableProducts = products.filter(product =>
    product.active !== false && (!isInstallments || product.allowsInstallments === true)
  )
  const eligibleClients = records.filter(record => {
    if (record.client.active !== true) return false
    if (!isInstallments) return true
    if (hasActiveCredit(record)) return false
    if (!creditPolicy) return false

    const client = record.client
    return Number(client.limiteCredito) >= Number(creditPolicy.capitalMinimo) &&
      Number(client.teaPactada) >= Number(creditPolicy.teaMinima) &&
      Number(client.teaPactada) <= Number(creditPolicy.teaMaxima) &&
      Number(client.plazoMaximoMeses) >= 1
  })

  function updateCreditForm(changes) {
    setCreditForm(current => ({ ...current, ...changes }))
    setPreview(null)
    setPreviewError('')
    setError('')
  }

  async function openCreditModal() {
    if (openingCredit) return
    setOpeningCredit(true)
    const loaded = await loadData()
    setOpeningCredit(false)
    if (!loaded) return
    const { financeData: latestRecords, policyData } = loaded
    if (planId) navigate('/store/credits')

    const firstClient = latestRecords.find(record =>
      policyData &&
      record.client.active === true &&
      !hasActiveCredit(record) &&
      Number(record.client.limiteCredito) >= Number(policyData.capitalMinimo) &&
      Number(record.client.teaPactada) >= Number(policyData.teaMinima) &&
      Number(record.client.teaPactada) <= Number(policyData.teaMaxima) &&
      Number(record.client.plazoMaximoMeses) >= 1
    )?.client
    setCreditForm({ ...emptyCredit, clientId: firstClient ? String(firstClient.id) : '' })
    setPreview(null)
    setPreviewError('')
    setError('')
    setSuccess('')
    setShowCreditModal(true)
  }

  function updateItem(index, field, value) {
    setCreditForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }))
    setPreview(null)
    setPreviewError('')
    setError('')
  }

  function addItem() {
    setCreditForm(current => ({
      ...current,
      items: [...current.items, { productId: '', quantity: 1 }]
    }))
    setPreview(null)
    setPreviewError('')
    setError('')
  }

  function removeItem(index) {
    setCreditForm(current => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }))
    setPreview(null)
    setPreviewError('')
    setError('')
  }

  function buildItems() {
    const usedIds = new Set()

    return creditForm.items.map((item, index) => {
      if (!item.productId) {
        throw new Error(`Selecciona un producto en la fila ${index + 1} para continuar.`)
      }

      const product = availableProducts.find(candidate => String(candidate.id) === String(item.productId))
      if (!product) {
        throw new Error(`El producto de la fila ${index + 1} no está disponible para esta forma de pago. Elige otro.`)
      }

      if (usedIds.has(String(product.id))) {
        throw new Error(`${product.name} ya está en la lista. Si necesitas más unidades, aumenta su cantidad.`)
      }
      usedIds.add(String(product.id))

      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Indica una cantidad de al menos 1 unidad para ${product.name}.`)
      }

      return { productId: product.id, quantity }
    })
  }

  function buildPurchasePayload() {
    const clientRecord = eligibleClients.find(record => String(record.client.id) === String(creditForm.clientId))
    if (!creditForm.clientId) {
      throw new Error('Selecciona un cliente disponible para continuar.')
    }
    if (!clientRecord) {
      throw new Error('Este cliente ya tiene un crédito activo o no cumple las condiciones de la tienda. Selecciona otro cliente.')
    }
    if (!creditForm.purchaseDate) {
      throw new Error('Selecciona la fecha de compra para continuar.')
    }

    const items = buildItems()
    if (isInstallments) {
      if (!creditPolicy) {
        throw new Error('No pudimos consultar los límites de crédito de la tienda. Cierra la ventana e inténtalo nuevamente.')
      }
      const downPaymentPercent = Number(creditForm.porcentajeCuotaInicial)
      if (!Number.isFinite(downPaymentPercent) || downPaymentPercent < 0 || downPaymentPercent > 50) {
        throw new Error('La cuota inicial debe estar entre el 0 % y el 50 % del total.')
      }
      const months = Number(creditForm.numeroMeses)
      const maximumMonths = Math.min(Number(clientRecord.client.plazoMaximoMeses), Number(creditPolicy.plazoMaximoMeses))
      if (!Number.isInteger(months) || months < 1 || months > maximumMonths) {
        throw new Error(`Para este cliente puedes elegir un plazo de 1 a ${maximumMonths} meses.`)
      }
      const purchaseTotal = items.reduce((total, item) => {
        const product = availableProducts.find(candidate => String(candidate.id) === String(item.productId))
        return total + Number(product.creditPrice) * item.quantity
      }, 0)
      const initialAmount = Math.round((purchaseTotal * downPaymentPercent / 100 + Number.EPSILON) * 100) / 100
      const principal = Math.round((purchaseTotal - initialAmount + Number.EPSILON) * 100) / 100
      const minimum = Number(creditPolicy.capitalMinimo)
      const maximum = Number(creditPolicy.capitalMaximo)
      if (principal < minimum || principal > maximum) {
        throw new Error(friendlyCreditError(new Error('fuera del rango permitido'), creditPolicy, clientRecord.client, principal))
      }
      if (principal > Number(clientRecord.client.limiteCredito)) {
        throw new Error(friendlyCreditError(new Error('limite de credito'), creditPolicy, clientRecord.client, principal))
      }
    }

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
      setPreviewError(friendlyCreditError(calcError, creditPolicy, eligibleClients.find(record => String(record.client.id) === String(creditForm.clientId))?.client))
    }
  }

  async function createCredit(event) {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)

    try {
      const payload = buildPurchasePayload()
      const purchase = await api.createPurchase(user.storeId, payload)
      setShowCreditModal(false)
      setPreview(null)

      if (payload.paymentMode === 'CASH') {
        setPaidPurchase(purchase)
        await loadData()
        return
      }

      const updatedData = await loadData()
      const createdPlan = updatedData?.financeData.flatMap(record =>
        record.plans.map(plan => ({ client: record.client, data: plan }))
      ).find(row => String(row.data.purchaseId) === String(purchase.id))

      if (createdPlan) {
        navigate(`/store/credits/${createdPlan.data.id}`)
      } else {
        setSuccess('Crédito registrado correctamente. No fue posible abrir su detalle automáticamente; puedes verlo desde la lista de créditos.')
      }
    } catch (createError) {
      setError(friendlyCreditError(createError, creditPolicy, eligibleClients.find(record => String(record.client.id) === String(creditForm.clientId))?.client))
    } finally {
      setSubmitting(false)
    }
  }

  async function registerPayment() {
    try {
      await api.payInstallment(user.storeId, selected.installment.id, paymentDate)
      navigate('/store/credits')
      await loadData()
    } catch (paymentError) {
      setError(friendlyCreditError(paymentError))
    }
  }

  return (
    <section className="content-page">
      <PageBanner
        title="Créditos"
        actions={
          <button className="primary-button" type="button" onClick={openCreditModal} disabled={openingCredit || loading}>
            {openingCredit ? 'Preparando formulario...' : 'Nuevo crédito'}
          </button>
        }
      />

      {error && <div className="alert-band">{error}</div>}
      {success && <div className="success-band">{success}</div>}

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
                      <td>{next ? `${date(next.dueDate)} * ${money(next.pagoTotal)}` : '—'}</td>
                      <td>{row.data.status === 'PAID' ? 'Pagado' : 'Activo'}</td>
                      <td>
                        <button className="text-button" type="button" onClick={() => navigate(`/store/credits/${row.data.id}`)}>Ver</button>
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
                  onChange={event => updateCreditForm({ clientId: event.target.value })}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {eligibleClients.map(record => (
                    <option key={record.client.id} value={record.client.id}>
                      {record.client.firstName} {record.client.lastName} * {record.client.documentNumber}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fecha de compra
                <input
                  type="date"
                  value={creditForm.purchaseDate}
                  onChange={event => updateCreditForm({ purchaseDate: event.target.value })}
                  required
                />
              </label>

              <label>
                Modalidad
                <select
                  value={creditForm.paymentMode}
                  onChange={event => {
                    const paymentMode = event.target.value
                    const matchingClients = records.filter(record =>
                      record.client.active === true && (paymentMode === 'CASH' || (
                        !hasActiveCredit(record) &&
                        creditPolicy &&
                        Number(record.client.limiteCredito) >= Number(creditPolicy.capitalMinimo) &&
                        Number(record.client.teaPactada) >= Number(creditPolicy.teaMinima) &&
                        Number(record.client.teaPactada) <= Number(creditPolicy.teaMaxima) &&
                        Number(record.client.plazoMaximoMeses) >= 1
                      ))
                    )
                    updateCreditForm({
                      paymentMode,
                      clientId: matchingClients.some(record => String(record.client.id) === String(creditForm.clientId))
                        ? creditForm.clientId
                        : String(matchingClients[0]?.client.id || ''),
                      items: creditForm.items.map(item => {
                        const product = products.find(candidate => String(candidate.id) === item.productId)
                        return paymentMode === 'INSTALLMENTS' && product?.allowsInstallments !== true
                          ? { ...item, productId: '' }
                          : item
                      })
                    })
                  }}
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
                      onChange={event => updateCreditForm({ porcentajeCuotaInicial: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Número de meses
                    <select
                      value={creditForm.numeroMeses}
                      onChange={event => updateCreditForm({ numeroMeses: event.target.value })}
                    >
                      {[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="credit-items">
              <div className="credit-items-heading">
                <h2>Productos</h2>
                <button
                  className="secondary-button credit-add-button"
                  type="button"
                  onClick={addItem}
                  disabled={creditForm.items.length >= availableProducts.length}
                >
                  Agregar producto
                </button>
              </div>
              {creditForm.items.map((item, index) => (
                <div className="credit-item-row" key={index}>
                  <label>
                    Producto
                    <select
                      value={item.productId}
                      onChange={event => updateItem(index, 'productId', event.target.value)}
                      required
                    >
                      <option value="">Selecciona un producto</option>
                      {availableProducts.map(product => (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={creditForm.items.some((other, otherIndex) =>
                            otherIndex !== index && String(other.productId) === String(product.id)
                          )}
                        >
                          {codeFor(product)} * {product.name} * {money(isInstallments ? product.creditPrice : product.cashPrice)}
                        </option>
                      ))}
                    </select>
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
              {availableProducts.length === 0 && (
                <p className="field-hint">No hay productos activos disponibles para esta modalidad de pago.</p>
              )}
              {eligibleClients.length === 0 && (
                <p className="alert-band">
                  {isInstallments && !creditPolicy
                    ? 'La tienda aún no tiene una política de crédito disponible. Revísala antes de registrar un crédito.'
                    : isInstallments
                      ? 'No hay clientes disponibles para un crédito nuevo. Revisa que estén activos, que cumplan los límites de la tienda y que no tengan otro crédito pendiente.'
                      : 'No hay clientes activos disponibles para esta compra.'}
                </p>
              )}
            </div>

            {isInstallments && (
              <div className="credit-preview">
                {creditPolicy && (
                  <p className="credit-limits-note">Puedes financiar entre {money(creditPolicy.capitalMinimo)} y {money(creditPolicy.capitalMaximo)}, según la política de la tienda.</p>
                )}
                <button className="secondary-button credit-calculate-button" type="button" onClick={calculatePreview} disabled={eligibleClients.length === 0 || availableProducts.length === 0}>
                  Calcular cronograma
                </button>

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

            {error && <div className="alert-band">{error}</div>}
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={submitting || availableProducts.length === 0 || eligibleClients.length === 0}>
                {submitting ? 'Registrando...' : 'Registrar crédito'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {paidPurchase && (
        <Modal title="Compra al contado registrada" onClose={() => setPaidPurchase(null)}>
          <div className="credit-detail">
            <p>Compra N.° {paidPurchase.id} registrada correctamente.</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(paidPurchase.items || []).map(item => (
                    <tr key={item.productId}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <strong>Total {money(paidPurchase.total)}</strong>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal
          title={`${selected.client.firstName} ${selected.client.lastName}`}
          onClose={() => navigate('/store/credits')}
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
                label={`Pagar cuota ${selected.installment.installmentNumber} * ${money(selected.installment.pagoTotal)}`}
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
