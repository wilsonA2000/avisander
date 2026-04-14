// Imagen de producto con fallback glassmórfico (ícono 3D + vidrio esmerilado).
// Orden de prioridad:
//   1. product.image_url → foto real
//   2. CategoryIcon variante 'card' → placeholder premium con ícono 3D

import CategoryIcon from './CategoryIcon'

function ProductImage({ product, className = '', imgClassName = '', size = 'md' }) {
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    )
  }

  // Mapear `size` del placeholder a tamaños del ícono interior
  const iconSize = size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg'
  return (
    <CategoryIcon
      category={product?.category_name}
      variant="card"
      size={iconSize}
      className={className}
    />
  )
}

export default ProductImage
