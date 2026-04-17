// Plantillas prediseñadas para redes sociales de Avisander.
// Cada plantilla define tamaño de canvas + elementos iniciales.

export const TEMPLATES = [
  {
    id: 'instagram-promo',
    name: 'Promo Instagram',
    category: 'Instagram',
    canvasSize: { width: 1080, height: 1080 },
    bgColor: '#0A0A0A',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1080, height: 1080, fill: '#0A0A0A', draggable: false } },
      { type: 'text', attrs: { text: 'OFERTA ESPECIAL', x: 80, y: 180, fontSize: 64, fontFamily: 'Playfair Display', fill: '#FFD800', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: '-30%', x: 80, y: 280, fontSize: 140, fontFamily: 'Impact', fill: '#F58220', stroke: '#8B1F28', strokeWidth: 3, draggable: true } },
      { type: 'text', attrs: { text: 'En cortes premium seleccionados', x: 80, y: 460, fontSize: 32, fontFamily: 'Inter', fill: '#FFFFFF', draggable: true } },
      { type: 'text', attrs: { text: 'AVISANDER', x: 80, y: 950, fontSize: 28, fontFamily: 'Inter', fill: '#F58220', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'Carnicería Premium · Bucaramanga', x: 80, y: 990, fontSize: 18, fontFamily: 'Inter', fill: '#666666', draggable: true } },
    ]
  },
  {
    id: 'instagram-story',
    name: 'Story Producto',
    category: 'Instagram',
    canvasSize: { width: 1080, height: 1920 },
    bgColor: '#FFFAF3',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1080, height: 1920, fill: '#FFFAF3', draggable: false } },
      { type: 'text', attrs: { text: 'PRODUCTO\nDEL DÍA', x: 100, y: 200, fontSize: 72, fontFamily: 'Playfair Display', fill: '#8B1F28', fontStyle: 'bold italic', draggable: true, lineHeight: 1.1 } },
      { type: 'rect', attrs: { x: 100, y: 400, width: 880, height: 880, fill: '#F5F0EB', cornerRadius: 20, draggable: false } },
      { type: 'text', attrs: { text: 'Tu imagen aquí', x: 400, y: 800, fontSize: 24, fontFamily: 'Inter', fill: '#999', draggable: true } },
      { type: 'text', attrs: { text: '$35.000 /kg', x: 100, y: 1380, fontSize: 56, fontFamily: 'Inter', fill: '#F58220', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'Pide por WhatsApp', x: 100, y: 1470, fontSize: 28, fontFamily: 'Inter', fill: '#16A34A', draggable: true } },
      { type: 'text', attrs: { text: '@avisander.co', x: 100, y: 1780, fontSize: 22, fontFamily: 'Inter', fill: '#999', draggable: true } },
    ]
  },
  {
    id: 'facebook-post',
    name: 'Post Facebook',
    category: 'Facebook',
    canvasSize: { width: 1200, height: 630 },
    bgColor: '#8B1F28',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1200, height: 630, fill: '#8B1F28', draggable: false } },
      { type: 'text', attrs: { text: 'CARNES PREMIUM', x: 60, y: 80, fontSize: 54, fontFamily: 'Playfair Display', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'Frescura y calidad\ngarantizada', x: 60, y: 170, fontSize: 36, fontFamily: 'Inter', fill: '#FFD800', draggable: true, lineHeight: 1.3 } },
      { type: 'text', attrs: { text: 'Pide a domicilio en Bucaramanga', x: 60, y: 300, fontSize: 24, fontFamily: 'Inter', fill: '#FFFFFF', opacity: 0.8, draggable: true } },
      { type: 'rect', attrs: { x: 60, y: 380, width: 280, height: 50, fill: '#F58220', cornerRadius: 25, draggable: true } },
      { type: 'text', attrs: { text: 'Pedir por WhatsApp', x: 85, y: 392, fontSize: 20, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'AVISANDER', x: 60, y: 540, fontSize: 24, fontFamily: 'Inter', fill: '#F58220', fontStyle: 'bold', draggable: true } },
    ]
  },
  {
    id: 'whatsapp-status',
    name: 'Estado WhatsApp',
    category: 'WhatsApp',
    canvasSize: { width: 1080, height: 1920 },
    bgColor: '#16A34A',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1080, height: 1920, fill: '#16A34A', draggable: false } },
      { type: 'text', attrs: { text: 'HOY\nTENEMOS', x: 100, y: 300, fontSize: 80, fontFamily: 'Impact', fill: '#FFFFFF', draggable: true, lineHeight: 1.1 } },
      { type: 'text', attrs: { text: 'Costillas BBQ', x: 100, y: 550, fontSize: 64, fontFamily: 'Playfair Display', fill: '#FFD800', fontStyle: 'bold italic', draggable: true } },
      { type: 'text', attrs: { text: '$18.000 /kg', x: 100, y: 680, fontSize: 72, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'Escríbenos para pedir', x: 100, y: 1600, fontSize: 28, fontFamily: 'Inter', fill: '#FFFFFF', opacity: 0.8, draggable: true } },
      { type: 'text', attrs: { text: '📲 312 300 5253', x: 100, y: 1660, fontSize: 36, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
    ]
  },
  {
    id: 'sale-banner',
    name: 'Banner Descuento',
    category: 'Promociones',
    canvasSize: { width: 1200, height: 400 },
    bgColor: '#0A0A0A',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1200, height: 400, fill: '#0A0A0A', draggable: false } },
      { type: 'text', attrs: { text: 'SÚPER', x: 60, y: 40, fontSize: 48, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'OFERTA', x: 60, y: 100, fontSize: 120, fontFamily: 'Impact', fill: '#F58220', draggable: true } },
      { type: 'text', attrs: { text: 'Hasta -40% en cortes seleccionados', x: 60, y: 260, fontSize: 28, fontFamily: 'Inter', fill: '#FFFFFF', opacity: 0.8, draggable: true } },
      { type: 'text', attrs: { text: 'Solo este fin de semana', x: 60, y: 310, fontSize: 22, fontFamily: 'Inter', fill: '#FFD800', draggable: true } },
      { type: 'text', attrs: { text: 'AVISANDER', x: 980, y: 320, fontSize: 28, fontFamily: 'Inter', fill: '#F58220', fontStyle: 'bold', draggable: true } },
    ]
  },
  {
    id: 'menu-dia',
    name: 'Menú del Día',
    category: 'Promociones',
    canvasSize: { width: 1080, height: 1080 },
    bgColor: '#FFFAF3',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1080, height: 1080, fill: '#FFFAF3', draggable: false } },
      { type: 'text', attrs: { text: 'MENÚ DEL DÍA', x: 100, y: 80, fontSize: 52, fontFamily: 'Playfair Display', fill: '#8B1F28', fontStyle: 'bold', draggable: true } },
      { type: 'rect', attrs: { x: 100, y: 160, width: 200, height: 4, fill: '#F58220', draggable: false } },
      { type: 'text', attrs: { text: '🥩 Lomo de res premium\n🍗 Pechuga de pollo\n🥓 Chorizo artesanal\n🧀 Queso doble crema', x: 100, y: 220, fontSize: 32, fontFamily: 'Inter', fill: '#333333', draggable: true, lineHeight: 1.8 } },
      { type: 'text', attrs: { text: 'Combo desde', x: 100, y: 600, fontSize: 24, fontFamily: 'Inter', fill: '#666', draggable: true } },
      { type: 'text', attrs: { text: '$45.000', x: 100, y: 640, fontSize: 72, fontFamily: 'Inter', fill: '#F58220', fontStyle: 'bold', draggable: true } },
      { type: 'text', attrs: { text: 'Incluye domicilio en Bucaramanga', x: 100, y: 740, fontSize: 20, fontFamily: 'Inter', fill: '#16A34A', draggable: true } },
      { type: 'text', attrs: { text: 'AVISANDER · Cra 30 #20-70 San Alonso', x: 100, y: 960, fontSize: 18, fontFamily: 'Inter', fill: '#999', draggable: true } },
    ]
  },
  {
    id: 'combo-familiar',
    name: 'Combo Familiar',
    category: 'Promociones',
    canvasSize: { width: 1080, height: 1080 },
    bgColor: '#F58220',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1080, height: 1080, fill: '#F58220', draggable: false } },
      { type: 'text', attrs: { text: 'COMBO\nFAMILIAR', x: 80, y: 100, fontSize: 96, fontFamily: 'Impact', fill: '#FFFFFF', draggable: true, lineHeight: 1 } },
      { type: 'rect', attrs: { x: 80, y: 340, width: 920, height: 4, fill: '#FFFFFF', opacity: 0.5, draggable: false } },
      { type: 'text', attrs: { text: '• 1kg Lomo de res\n• 1kg Pechuga\n• 500g Chorizo\n• 500g Costilla', x: 100, y: 400, fontSize: 34, fontFamily: 'Inter', fill: '#FFFFFF', draggable: true, lineHeight: 1.6 } },
      { type: 'text', attrs: { text: '$89.900', x: 100, y: 720, fontSize: 96, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', stroke: '#8B1F28', strokeWidth: 2, draggable: true } },
      { type: 'text', attrs: { text: 'antes $120.000', x: 100, y: 840, fontSize: 28, fontFamily: 'Inter', fill: '#FFFFFF', opacity: 0.7, textDecoration: 'line-through', draggable: true } },
      { type: 'text', attrs: { text: 'Pide ya · 312 300 5253', x: 100, y: 960, fontSize: 30, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
    ]
  },
  {
    id: 'youtube-thumb',
    name: 'YouTube Thumbnail',
    category: 'YouTube',
    canvasSize: { width: 1280, height: 720 },
    bgColor: '#0A0A0A',
    elements: [
      { type: 'rect', attrs: { x: 0, y: 0, width: 1280, height: 720, fill: '#0A0A0A', draggable: false } },
      { type: 'text', attrs: { text: 'CÓMO ELEGIR', x: 60, y: 120, fontSize: 64, fontFamily: 'Impact', fill: '#FFFFFF', draggable: true } },
      { type: 'text', attrs: { text: 'LA MEJOR\nCARNE', x: 60, y: 220, fontSize: 96, fontFamily: 'Impact', fill: '#F58220', draggable: true, lineHeight: 1 } },
      { type: 'rect', attrs: { x: 60, y: 500, width: 300, height: 60, fill: '#E63946', cornerRadius: 8, draggable: true } },
      { type: 'text', attrs: { text: 'TIPS PRO', x: 110, y: 515, fontSize: 32, fontFamily: 'Inter', fill: '#FFFFFF', fontStyle: 'bold', draggable: true } },
    ]
  },
]

export function getTemplatesByCategory() {
  const cats = {}
  TEMPLATES.forEach(t => {
    if (!cats[t.category]) cats[t.category] = []
    cats[t.category].push(t)
  })
  return cats
}
