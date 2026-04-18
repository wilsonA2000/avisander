const { db } = require('../db/database')

const recipes = [
  {
    slug: 'huevos-pericos',
    title: 'Huevos Pericos',
    meal_type: 'desayuno',
    servings: 2,
    duration_min: 10,
    difficulty: 'facil',
    summary: 'Clásico desayuno colombiano: huevos revueltos con tomate y cebolla larga. Se acompaña con arepa y chocolate caliente.',
    cover_image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 4 huevos frescos
- 1 tomate maduro picado fino
- 2 tallos de cebolla larga picada
- 1 cda de mantequilla o aceite
- Sal y pimienta al gusto

## Preparación

1. Sofríe la cebolla larga con la mantequilla 2 min.
2. Agrega el tomate, cocina 3 min hasta que suelte su jugo.
3. Bate los huevos con sal y pimienta. Vierte sobre la mezcla.
4. Revuelve suave hasta cuajar (2-3 min). Sirve con arepa.

## Tip

Añade cilantro fresco al final para aroma extra.`,
  },
  {
    slug: 'calentado-paisa',
    title: 'Calentado Paisa',
    meal_type: 'desayuno',
    servings: 2,
    duration_min: 15,
    difficulty: 'facil',
    summary: 'Desayuno del día siguiente: arroz, fríjoles, carne desmechada y huevo frito. Hogar en un plato.',
    cover_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 2 tazas arroz blanco cocido (del día anterior)
- 1 taza fríjoles rojos cocinados
- 200 g carne desmechada (sobrante o fresca sellada)
- 2 huevos
- 2 arepas
- Aceite, cebolla larga, sal

## Preparación

1. En una sartén caliente con aceite, sofríe cebolla larga.
2. Agrega el arroz, luego los fríjoles y la carne. Mezcla 5 min.
3. Aparte, fríe los huevos con yema blanda.
4. Sirve el calentado con el huevo encima y arepa al lado.`,
  },
  {
    slug: 'changua-bogotana',
    title: 'Changua Bogotana',
    meal_type: 'desayuno',
    servings: 2,
    duration_min: 15,
    difficulty: 'facil',
    summary: 'Caldo cundiboyacense de leche con cilantro y huevo pochado. Reconfortante para mañanas frías.',
    cover_image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 500 ml leche entera
- 250 ml agua
- 2 huevos
- 2 cdas cebolla larga picada
- 2 cdas cilantro fresco
- Sal, pimienta
- Calado o pan viejo

## Preparación

1. Hierve leche + agua con cebolla larga y sal.
2. Cuando rompa el hervor, casca los huevos uno a uno; cocina 2 min (yema blanda).
3. Sirve en tazón, añade cilantro fresco y calado al fondo.`,
  },
  {
    slug: 'chicharron-express',
    title: 'Chicharrón Express',
    meal_type: 'rapido',
    servings: 2,
    duration_min: 25,
    difficulty: 'facil',
    summary: 'Chicharrón crocante en 25 minutos sin pre-cocción complicada. Ideal para almuerzo rápido.',
    cover_image_url: 'https://images.unsplash.com/photo-1623961998735-0f24149b20b0?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 400 g panceta/tocino con 3 cm de grasa
- Sal, pimienta, comino
- 1/2 taza agua

## Preparación

1. Corta el chicharrón en tiras de 4 cm. Salpimenta y espolvorea comino.
2. Ponlo en sartén fría con el agua; tapa y cocina 10 min a fuego medio (ablanda).
3. Destapa, deja evaporar el agua; sube fuego y fríe en su propia grasa 10-12 min volteando hasta dorar y crocante.
4. Escurre sobre papel. Sirve con limón.`,
  },
  {
    slug: 'pechuga-plancha-hierbas',
    title: 'Pechuga a la Plancha con Hierbas',
    meal_type: 'rapido',
    servings: 2,
    duration_min: 20,
    difficulty: 'facil',
    summary: 'Pechuga jugosa marinada con hierbas, lista en 20 min. Liviana y sabrosa.',
    cover_image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 2 pechugas deshuesadas
- 2 dientes de ajo machacados
- 1 cdita romero seco, 1 cdita tomillo
- Jugo de 1 limón
- 2 cdas aceite de oliva
- Sal, pimienta

## Preparación

1. Mezcla ajo, hierbas, limón, aceite, sal y pimienta. Marina las pechugas 10 min.
2. Calienta plancha/sartén bien caliente. Asa 4-5 min por lado (según grosor).
3. Deja reposar 3 min antes de cortar. Sirve con ensalada verde.`,
  },
  {
    slug: 'churrasco-15-minutos',
    title: 'Churrasco en 15 Minutos',
    meal_type: 'rapido',
    servings: 2,
    duration_min: 15,
    difficulty: 'facil',
    summary: 'Corte delgado de res sellado rápido, con chimichurri casero. Carne a la mesa en un cuarto de hora.',
    cover_image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 2 filetes de churrasco (sobrebarriga, falda o lomo fino) de 200 g cada uno
- Sal gruesa, pimienta
- 1 diente ajo
- 1/2 taza perejil fresco
- 2 cdas vinagre, 4 cdas aceite de oliva

## Preparación

1. Saca la carne del refrigerador 15 min antes. Salpimenta.
2. Calienta sartén/plancha a fuego alto. Sella 3 min por lado (término medio).
3. Mientras: pica ajo y perejil, mezcla con vinagre y aceite — chimichurri listo.
4. Reposa carne 2 min, corta en tiras y baña con chimichurri.`,
  },
  {
    slug: 'arroz-con-pollo-colombiano',
    title: 'Arroz con Pollo Colombiano',
    meal_type: 'almuerzo',
    servings: 6,
    duration_min: 60,
    difficulty: 'media',
    summary: 'El arroz amarillo con pollo, zanahoria, arveja y maíz. Almuerzo familiar por excelencia.',
    cover_image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 6)

- 1 pollo en presas (o 6 muslos)
- 3 tazas arroz
- 1 zanahoria en cubos
- 1 taza arveja
- 1 taza maíz tierno
- 1 pimentón rojo picado
- 2 tomates, 1 cebolla, 2 dientes ajo
- Achiote o color (1 cda), cubo de caldo
- Aceite, sal, pimienta

## Preparación

1. Sella el pollo con sal y pimienta en la olla. Retira.
2. En la misma olla sofríe cebolla, ajo, tomate, pimentón y achiote 10 min.
3. Devuelve el pollo. Añade zanahoria, maíz, arveja y arroz. Tuesta 2 min.
4. Agrega 5 tazas agua caliente + cubo de caldo. Tapa y cocina 25 min a fuego bajo.
5. Reposa 10 min con tapa antes de servir.`,
  },
  {
    slug: 'albondigas-salsa-criolla',
    title: 'Albóndigas en Salsa Criolla',
    meal_type: 'almuerzo',
    servings: 4,
    duration_min: 45,
    difficulty: 'media',
    summary: 'Albóndigas jugosas en salsa de tomate y hogao, con arroz blanco y tajadas.',
    cover_image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 4)

- 500 g carne molida de res
- 1 huevo, 1/2 taza miga de pan, 2 cdas leche
- 1 cebolla picada fina, 2 dientes ajo
- 3 tomates rallados, 1 pimentón
- Comino, orégano, sal, pimienta
- Aceite

## Preparación

1. Mezcla carne, huevo, miga remojada en leche, 1/2 cebolla, 1 ajo, comino, sal y pimienta. Forma albóndigas de 3 cm.
2. Dora en aceite 4-5 min girando. Reserva.
3. En la misma sartén sofríe resto de cebolla, ajo, pimentón, tomate rallado y orégano 10 min.
4. Agrega las albóndigas, tapa 10 min a fuego bajo.
5. Sirve con arroz blanco y plátano maduro.`,
  },
  {
    slug: 'costilla-desmechada',
    title: 'Costilla Desmechada',
    meal_type: 'almuerzo',
    servings: 6,
    duration_min: 150,
    difficulty: 'media',
    summary: 'Costilla de res en olla a presión tan tierna que se desmecha sola, bañada en hogao criollo.',
    cover_image_url: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 6)

- 1.5 kg costilla de res
- 2 cebollas, 4 dientes ajo, 4 tomates
- 1 zanahoria, laurel, comino
- 1 taza cerveza o vino tinto
- Sal, pimienta

## Preparación

1. Salpimenta la costilla. Sella en olla a presión.
2. Agrega cebolla en trozos, ajo, tomate, zanahoria, laurel y cerveza. Cubre con agua.
3. Tapa y cocina 1h en presión (o 3h olla normal).
4. Retira huesos, desmecha con dos tenedores. Reduce la salsa 10 min y regresa la carne.
5. Sirve con arroz y aguacate.`,
  },
  {
    slug: 'pollo-horno-papas',
    title: 'Pollo al Horno con Papas',
    meal_type: 'cena',
    servings: 4,
    duration_min: 70,
    difficulty: 'facil',
    summary: 'Pollo entero al horno con piel dorada y papas criollas asadas en su jugo.',
    cover_image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 4)

- 1 pollo entero (1.5-2 kg)
- 1 kg papa criolla o pastusa en cuartos
- 1 limón, 4 dientes ajo, romero
- Mantequilla, aceite de oliva
- Sal, pimienta

## Preparación

1. Precalienta horno a 200°C.
2. Frota el pollo con mantequilla, ajo machacado, jugo de limón, romero, sal y pimienta. Mete el limón exprimido dentro.
3. Rodea con papas aceitadas y saladas en una bandeja.
4. Hornea 60-70 min. Baña con los jugos cada 20 min. Piel debe quedar dorada.
5. Reposa 10 min antes de trinchar.`,
  },
  {
    slug: 'chuleta-cerdo-salsa-mora',
    title: 'Chuleta de Cerdo en Salsa de Mora',
    meal_type: 'cena',
    servings: 4,
    duration_min: 40,
    difficulty: 'media',
    summary: 'Chuletas jugosas con salsa agridulce de mora de castilla. Elegante y fácil.',
    cover_image_url: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 4)

- 4 chuletas de cerdo con hueso
- 2 tazas mora de castilla
- 3 cdas panela rallada
- 1/2 taza vino tinto
- 1 cda mantequilla
- Sal, pimienta

## Preparación

1. Salpimenta chuletas. Dora 4 min por lado en sartén. Reserva tapadas.
2. En la misma sartén, agrega moras, panela y vino. Cocina 8 min hasta espesar.
3. Cuela si prefieres textura lisa. Monta con mantequilla.
4. Baña las chuletas con la salsa caliente. Sirve con puré o arroz.`,
  },
  {
    slug: 'ribeye-chimichurri',
    title: 'Ribeye con Chimichurri Argentino',
    meal_type: 'gourmet',
    servings: 2,
    duration_min: 30,
    difficulty: 'media',
    summary: 'Ribeye sellado a la perfección con chimichurri verde casero. Corte premium para ocasión especial.',
    cover_image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 2 ribeye de 300 g, 2-3 cm grosor
- Sal gruesa, pimienta negra
- Para chimichurri: 1 taza perejil, 1/2 taza cilantro, 4 dientes ajo, 1 cda orégano, 1/2 taza aceite oliva, 3 cdas vinagre tinto, ají al gusto

## Preparación

1. Saca la carne 30 min antes. Sazona con sal gruesa y pimienta.
2. Calienta sartén de hierro al máximo. Sella 3 min por lado (medio crudo) o 4 (medio).
3. Reposa 5 min sobre tabla.
4. Pica fino hierbas y ajo. Mezcla con aceite, vinagre y sal. Reposa 10 min.
5. Sirve el ribeye entero con chimichurri encima o al lado.`,
  },
  {
    slug: 'solomito-salsa-vino',
    title: 'Solomito en Salsa de Vino Tinto',
    meal_type: 'gourmet',
    servings: 4,
    duration_min: 45,
    difficulty: 'media',
    summary: 'Medallones de solomito con reducción de vino tinto y mantequilla. Restaurante en casa.',
    cover_image_url: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 4)

- 4 medallones de solomito de 180 g
- 2 cdas mantequilla
- 1 chalota (o 1/4 cebolla) picada
- 1 taza vino tinto
- 1/2 taza caldo de res
- Tomillo fresco, sal, pimienta

## Preparación

1. Salpimenta los medallones. Sella en 1 cda mantequilla 3 min por lado. Reserva tapados.
2. En la sartén sofríe chalota 2 min. Deglasa con vino y tomillo. Reduce a la mitad (5 min).
3. Agrega caldo, reduce 5 min más. Añade mantequilla fría batiendo.
4. Sirve los medallones bañados. Acompaña con puré de papa.`,
  },
  {
    slug: 'tbone-parrilla-mantequilla-hierbas',
    title: 'T-Bone a la Parrilla con Mantequilla de Hierbas',
    meal_type: 'gourmet',
    servings: 2,
    duration_min: 25,
    difficulty: 'media',
    summary: 'T-Bone a la brasa con mantequilla compuesta derritiéndose encima. Corte espectacular.',
    cover_image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 2)

- 1 T-Bone grande (800-900 g)
- Sal gruesa, pimienta negra recién molida
- 100 g mantequilla a temperatura ambiente
- 2 dientes ajo, 2 cdas perejil, 1 cda tomillo, ralladura de limón

## Preparación

1. Mezcla mantequilla con ajo rallado, hierbas y limón. Forma un cilindro en papel film y refrigera.
2. Seca el T-Bone, sazona generoso con sal gruesa.
3. Parrilla muy caliente: 5 min por lado (término medio). En carbón es ideal.
4. Reposa 5 min. Corona con una rodaja de mantequilla de hierbas justo antes de servir.`,
  },
  {
    slug: 'cordero-horno-romero',
    title: 'Cordero al Horno con Romero',
    meal_type: 'especial',
    servings: 6,
    duration_min: 150,
    difficulty: 'media',
    summary: 'Pierna de cordero lentamente asada con romero, ajo y vino. Plato de fecha especial.',
    cover_image_url: 'https://images.unsplash.com/photo-1602253057119-44d745d9b860?w=1200&q=80&auto=format&fit=crop',
    body_markdown: `## Ingredientes (para 6)

- 2 kg pierna de cordero
- 8 dientes ajo, romero fresco
- 1 taza vino tinto
- Aceite oliva, sal gruesa, pimienta
- 2 cebollas, 3 zanahorias en trozos

## Preparación

1. Haz incisiones y mete ajos y ramitas de romero dentro. Frota con aceite, sal y pimienta.
2. En bandeja grande coloca cebolla y zanahoria de cama. Pon el cordero encima y agrega vino.
3. Horno a 180°C: 2h cubierto con papel aluminio, luego 20 min descubierto para dorar.
4. Reposa 15 min antes de cortar. Sirve con los vegetales.`,
  },
]

const insert = db.prepare(`
  INSERT INTO recipes
    (slug, title, summary, cover_image_url, body_markdown, duration_min, difficulty, meal_type, servings, is_published, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
`)

const tx = db.transaction((list) => {
  for (const r of list) {
    insert.run(
      r.slug,
      r.title,
      r.summary,
      r.cover_image_url,
      r.body_markdown,
      r.duration_min,
      r.difficulty,
      r.meal_type,
      r.servings
    )
  }
})

tx(recipes)
console.log(`✓ Insertadas ${recipes.length} recetas nuevas`)

const total = db.prepare('SELECT COUNT(*) as n FROM recipes').get()
console.log(`Total recetas en BD: ${total.n}`)

const byType = db
  .prepare('SELECT meal_type, COUNT(*) as n FROM recipes GROUP BY meal_type ORDER BY meal_type')
  .all()
console.table(byType)
