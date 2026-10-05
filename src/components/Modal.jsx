export default function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal-panel${wide ? ' modal-wide' : ''}`} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
