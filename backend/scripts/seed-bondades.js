// Auto-rellena bondades nutricionales + usos culinarios por categoría.
// Wilson luego puede editar producto por producto desde /admin/productos.
// Ejecutar: node scripts/seed-bondades.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { db, initialize } = require('../db/database')

initialize()

// Perfiles por categoría. El matching se hace sobre el NOMBRE de la categoría
// (lowercase, sin acentos). Si un producto no matchea, usa el perfil 'default'.
const PROFILES = {
  res: {
    benefits: `La **carne de res** aporta proteína completa de alto valor biológico, esencial para el crecimiento muscular y la reparación celular.

**Nutrientes clave:**
- Hierro hemo de fácil absorción (previene anemia).
- Zinc (fortalece sistema inmune).
- Vitamina B12 (clave para el sistema nervioso).
- Creatina natural (energía muscular).

**Recomendación:** Consumo moderado 2-3 veces por semana, preferiblemente cortes magros. Ideal en dietas activas, adolescentes en crecimiento y recuperación post-ejercicio.`,
    uses: ['asar', 'parrilla', 'estofar', 'hornear', 'sudar', 'sofreir']
  },
  'carne de res': {
    benefits: `La **carne de res** aporta proteína completa de alto valor biológico, esencial para el crecimiento muscular y la reparación celular.

**Nutrientes clave:**
- Hierro hemo de fácil absorción (previene anemia).
- Zinc (fortalece sistema inmune).
- Vitamina B12 (clave para el sistema nervioso).
- Creatina natural (energía muscular).

**Recomendación:** Consumo moderado 2-3 veces por semana, preferiblemente cortes magros. Ideal en dietas activas, adolescentes en crecimiento y recuperación post-ejercicio.`,
    uses: ['asar', 'parrilla', 'estofar', 'hornear', 'sudar', 'sofreir']
  },
  cerdo: {
    benefits: `La **carne de cerdo** es una fuente rica en tiamina (vitamina B1) — más que cualquier otra carne — clave para el metabolismo energético y la función nerviosa.

**Nutrientes clave:**
- Tiamina (B1) en altísima concentración.
- Selenio (antioxidante protector celular).
- Niacina, B6, fósforo y zinc.
- Proteína magra en cortes como lomo (solo 6-8 g grasa/100g).

**Recomendación:** Los cortes magros (lomo, solomillo) son excelentes en dietas balanceadas. Los cortes con grasa aportan sabor y saciedad, ideales para asados y preparaciones lentas.`,
    uses: ['asar', 'hornear', 'estofar', 'sofreir', 'ahumar', 'parrilla']
  },
  pollo: {
    benefits: `El **pollo** es la proteína más versátil y magra de la dieta. Bajo en grasa saturada y alto en proteína completa.

**Nutrientes clave:**
- Proteína de alta calidad (26-30 g por 100g).
- Niacina y B6 (energía y metabolismo).
- Selenio y fósforo.
- Bajo aporte calórico sin piel (~165 kcal/100g).

**Recomendación:** Ideal para todas las edades y dietas. La pechuga es perfecta para deportistas y dietas hipocalóricas; los muslos y alas son más jugosos y aportan más hierro.`,
    uses: ['asar', 'hornear', 'freir', 'sudar', 'sofreir', 'estofar']
  },
  'pollo fresco': {
    benefits: `**Pollo fresco de granja local.** Proteína magra, bajo en grasa saturada, alto valor nutricional.

**Nutrientes clave:**
- 26-30 g de proteína por cada 100 g.
- Niacina, vitamina B6 y selenio.
- Bajo aporte calórico sin piel (~165 kcal/100g).

**Recomendación:** Consume dentro de los 2 días siguientes a la compra para aprovechar máxima frescura. Conserva refrigerado entre 0 y 4°C.`,
    uses: ['asar', 'hornear', 'freir', 'sudar', 'sofreir']
  },
  'pollo marinado': {
    benefits: `**Pollo marinado artesanalmente** con mezcla de hierbas, especias y aceite de oliva. Listo para cocinar.

**Ventaja:** Ahorras tiempo de preparación. La marinada penetra la carne y garantiza jugosidad y sabor en cualquier método de cocción.

**Nutrientes clave del pollo:**
- Proteína magra de alto valor biológico.
- Niacina, B6, selenio.
- Fácil digestión.`,
    uses: ['asar', 'hornear', 'parrilla', 'freir']
  },
  'visceras pollo': {
    benefits: `Las **vísceras de pollo** (hígado, molleja, corazón) son un superalimento económico con altísimo aporte nutricional.

**Nutrientes clave del hígado:**
- Vitamina A en forma activa (salud visual y piel).
- Hierro hemo (3x más que la carne de res).
- Vitamina B12 y folato (clave en embarazo).
- Zinc, selenio y cobre.

**Recomendación:** 1 porción por semana aporta nutrientes críticos. Ideal en dietas para recuperar niveles de hemoglobina.`,
    uses: ['sofreir', 'guisar', 'estofar']
  },
  huevos: {
    benefits: `El **huevo** es considerado el alimento proteico más completo y económico del planeta.

**Nutrientes clave:**
- Proteína completa con todos los aminoácidos esenciales.
- Colina (fundamental para el cerebro y memoria).
- Vitamina D, B12, B2, selenio, luteína.
- Grasa saludable en la yema.

**Recomendación:** 1-2 huevos al día son seguros para la mayoría de adultos sanos. Perfectos en el desayuno para mantener saciedad y energía.`,
    uses: ['freir', 'hornear', 'cocinar']
  },
  lacteos: {
    benefits: `Los **lácteos frescos** son una fuente natural de calcio, proteína y vitaminas del complejo B.

**Nutrientes clave:**
- Calcio biodisponible (huesos y dientes).
- Proteína del suero (recuperación muscular).
- Vitamina B12, B2 (riboflavina).
- Vitaminas A y D (si están fortificados).

**Recomendación:** 2-3 porciones diarias aseguran los requerimientos de calcio. Los quesos curados aportan más proteína; los frescos tienen menos grasa.`,
    uses: ['cocinar', 'hornear']
  },
  'carnes frias': {
    benefits: `Las **carnes frías** (jamón, salchichón, mortadela) son preparaciones listas para consumo. Ricas en proteína y prácticas para meriendas rápidas.

**Recomendación:** Consumo moderado por su contenido de sodio. Elige variedades bajas en sodio y sin nitritos añadidos cuando sea posible. Ideales para sandwiches, tablas y picadas.`,
    uses: ['freir', 'hornear']
  },
  embutidos: {
    benefits: `Los **embutidos artesanales** (chorizo, longaniza, butifarra) son preparaciones tradicionales colombianas con especias propias.

**Valor nutricional:**
- Proteína animal concentrada.
- Hierro hemo.
- Aportes de zinc y B12.

**Recomendación:** Consumo ocasional dentro de una dieta balanceada. Perfectos en bandejas, desayunos paisas o parrillas.`,
    uses: ['asar', 'parrilla', 'freir', 'sofreir']
  },
  congelado: {
    benefits: `**Productos congelados** procesados en condiciones óptimas para preservar nutrientes y seguridad alimentaria.

**Ventajas:**
- Mayor vida útil sin aditivos adicionales.
- Nutrientes preservados al momento del congelado.
- Comodidad de almacenamiento.

**Recomendación:** Descongela siempre en refrigerador (no a temperatura ambiente) para mantener inocuidad.`,
    uses: ['freir', 'hornear', 'cocinar']
  },
  fruver: {
    benefits: `**Frutas y verduras frescas** complementan perfectamente la proteína animal. Aportan fibra, vitaminas y antioxidantes.

**Recomendación:** 5 porciones al día entre frutas y verduras aseguran aporte adecuado de micronutrientes. Priorizamos productos de temporada y proveedores locales.`,
    uses: ['cocinar', 'hornear', 'sofreir']
  },
  varios: {
    benefits: `Producto seleccionado de nuestra tienda que complementa tu cocina diaria.`,
    uses: ['cocinar']
  },
  otros: {
    benefits: `Producto seleccionado de nuestra tienda que complementa tu cocina diaria.`,
    uses: ['cocinar']
  }
}

const DEFAULT_PROFILE = PROFILES.varios

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function pickProfile(categoryName, productName) {
  const catKey = normalize(categoryName)
  if (PROFILES[catKey]) return PROFILES[catKey]
  // Fallback por palabras clave en el nombre del producto.
  const n = normalize(productName)
  if (/lomo|pierna|muslo|pechuga|ala|pollo/.test(n)) return PROFILES.pollo
  if (/cerdo|chicharr|costilla|tocino|lechon|cabano/.test(n)) return PROFILES.cerdo
  if (/res|lomo|punta|posta|sobrebarriga|lengua|cadera|solomo|chata/.test(n)) return PROFILES.res
  if (/huevo/.test(n)) return PROFILES.huevos
  if (/queso|leche|yogurt|crema|mantequilla/.test(n)) return PROFILES.lacteos
  if (/chorizo|salchich|longaniza|jamon|mortadela|embutido/.test(n)) return PROFILES.embutidos
  return DEFAULT_PROFILE
}

console.log('── Sembrando bondades + usos culinarios ──')

const products = db
  .prepare(
    `SELECT p.id, p.name, p.benefits, p.culinary_uses, c.name as category_name
     FROM products p LEFT JOIN categories c ON p.category_id = c.id`
  )
  .all()

const update = db.prepare(
  'UPDATE products SET benefits = ?, culinary_uses = ? WHERE id = ?'
)

let updated = 0
let skipped = 0

for (const p of products) {
  // Si ya tiene benefits custom (no vacío), respetamos lo que el admin puso.
  if (p.benefits && p.benefits.trim().length > 40) {
    skipped++
    continue
  }
  const profile = pickProfile(p.category_name, p.name)
  update.run(profile.benefits, JSON.stringify(profile.uses), p.id)
  updated++
}

console.log(`  ✓ ${updated} productos rellenados con bondades + usos.`)
console.log(`  · ${skipped} productos con bondades custom ya definidas (respetados).`)
console.log('\n✅ Seed de bondades completo.')
