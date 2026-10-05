import bunnyProducts from '../assets/bunny-products.png'
import bunnyHeart from '../assets/bunny-heart.png'
import bunnyHappy from '../assets/bunny-happy.png'
import bunnyStar from '../assets/bunny-star.png'
import bunnyQuestion from '../assets/bunny-question.png'
import bunnyDefault from '../assets/bunny-default.png'
import bunnyWink from '../assets/bunny-wink.png'
import bunnyLie from '../assets/bunny-lie.png'
import starsPink from '../assets/stars-pink-trio.png'

const bunnyByTitle = {
  Productos: bunnyProducts,
  'Mis créditos': bunnyHeart,
  'Mi perfil': bunnyHappy,
  Clientes: bunnyWink,
  Créditos: bunnyLie,
  Tiendas: bunnyStar,
  'Configuración financiera': bunnyQuestion
}

export default function PageBanner({ title, actions }) {
  return (
    <div className="page-banner">
      <div className="page-banner-copy">
        <h1>{title}</h1>
        {actions && <div className="page-banner-actions">{actions}</div>}
      </div>
      <img className="page-banner-stars" src={starsPink} alt="" aria-hidden="true" />
      <img className="page-banner-bunny" src={bunnyByTitle[title] || bunnyDefault} alt="" aria-hidden="true" />
    </div>
  )
}
