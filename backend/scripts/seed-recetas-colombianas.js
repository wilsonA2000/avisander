// Siembra recetas colombianas reales (en español) curadas a mano, con fotos
// libres de Unsplash/Wikipedia. Reemplaza las recetas genéricas en inglés.
//
// Ejecutar: node scripts/seed-recetas-colombianas.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { db, initialize } = require('../db/database')
const { uniqueSlug } = require('../lib/productUtils')

initialize()

const RECETAS = [
  {
    title: 'Bandeja Paisa',
    summary: 'El plato insignia de Antioquia: fríjoles, carne molida, chicharrón, chorizo, huevo frito, aguacate, arepa y arroz blanco.',
    cover: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=1200&q=80&auto=format&fit=crop',
    duration: 90,
    difficulty: 'media',
    md: `## Ingredientes (para 4 personas)

- 500 g de carne molida de res
- 400 g de chicharrón de cerdo
- 4 chorizos colombianos
- 4 huevos
- 2 tazas de fríjoles rojos cocinados
- 2 tazas de arroz blanco cocido
- 2 plátanos maduros en tajadas
- 2 aguacates Hass
- 4 arepas antioqueñas
- Hogao (tomate, cebolla, comino)
- Sal, pimienta, comino al gusto

## Preparación

1. **Fríjoles**: sofríe la cebolla y el tomate, agrega los fríjoles ya cocidos con su caldo, sazona con comino y sal. Deja espesar 15 min.
2. **Chicharrón**: corta en tiras de 5 cm, hierve 10 min en agua con sal para ablandar. Fríe en su propia grasa a fuego medio hasta dorar y crocante.
3. **Carne molida**: sofríe cebolla picada, agrega la carne, sal, comino, pimienta. Cocina 8-10 min.
4. **Chorizo**: pincha con tenedor, asa 5 min por cada lado o fríe.
5. **Huevos**: fríe con yema blanda justo antes de servir.
6. **Tajadas**: fríe el plátano maduro en aceite caliente hasta dorar.
7. **Montaje**: sirve cada ingrediente en la bandeja con el arroz al centro, arepa aparte y aguacate en rodajas.

## Consejo del maestro carnicero

Pide en Avisander el chicharrón con 4 cm de tocino; para la carne, molida doble vuelta. Así el plato queda tradicional.`
  },
  {
    title: 'Ajiaco Santafereño',
    summary: 'Sopa bogotana con tres papas (criolla, pastusa, sabanera), pollo, maíz tierno, guascas y crema. Se sirve con aguacate y alcaparras.',
    cover: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80&auto=format&fit=crop',
    duration: 75,
    difficulty: 'media',
    md: `## Ingredientes (para 6 personas)

- 6 presas de pollo (muslo y contramuslo)
- 1 kg de papa criolla pelada
- 1 kg de papa pastusa en rodajas
- 500 g de papa sabanera en rodajas
- 4 mazorcas tiernas en trozos
- 1 manojo de guascas secas
- 2 cebollas largas
- 4 dientes de ajo
- 1 taza de crema de leche
- 1/2 taza de alcaparras
- 2 aguacates
- Cilantro, sal

## Preparación

1. Hierve el pollo con cebolla, ajo y sal en 3 L de agua (40 min). Reserva el caldo, desmenuza el pollo.
2. En el caldo, cocina las papas pastusa y sabanera 20 min hasta que se deshagan parcialmente y espesen.
3. Agrega la papa criolla y las mazorcas. Cocina 15 min.
4. Añade las guascas en el último momento (5 min), no más porque amargan.
5. Sirve caliente con el pollo desmenuzado encima, crema de leche, alcaparras y aguacate aparte.

## Consejo

Las guascas son clave — sin ellas no es ajiaco. Las consigues frescas o secas; las secas aguantan más tiempo.`
  },
  {
    title: 'Sobrebarriga a la Criolla',
    summary: 'Corte de falda de res cocinada en hogao con cerveza, suave y jugosa. Santandereana de pura cepa.',
    cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    duration: 180,
    difficulty: 'media',
    md: `## Ingredientes (para 4 personas)

- 1.5 kg de sobrebarriga (falda) de res
- 3 tomates maduros rallados
- 2 cebollas cabezonas picadas
- 4 dientes de ajo
- 1 cerveza (330 ml)
- 1 cucharada de panela rallada
- Comino, laurel, tomillo, sal, pimienta
- Aceite

## Preparación

1. Salpimenta la sobrebarriga. Sella en olla caliente con aceite por ambos lados (4 min cada lado).
2. Retira, en la misma olla sofríe cebolla y ajo, agrega el tomate rallado, comino, laurel. Cocina el hogao 10 min.
3. Regresa la carne, cubre con la cerveza y 2 tazas de agua. Agrega panela.
4. Tapa y cocina a fuego bajo 2 horas hasta que esté tan suave que se desgarre con un tenedor.
5. Destapa y reduce la salsa 15 min.
6. Sirve con arroz blanco y papa chorreada.

## Consejo del maestro carnicero

En Avisander pide la sobrebarriga con una capa de grasa de 5 mm — eso es lo que le da jugosidad y sabor. Doble cocción (olla 2h + horno 200°C 15 min) la hace aún más tierna.`
  },
  {
    title: 'Lomo de Cerdo a la Bandeja',
    summary: 'Lomo de cerdo marinado con panela, naranja y ajo, acompañado de puré de papa amarilla.',
    cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    duration: 60,
    difficulty: 'facil',
    md: `## Ingredientes (para 4 personas)

- 1 kg de lomo de cerdo en medallones de 2.5 cm
- Jugo de 2 naranjas
- 3 cucharadas de panela rallada
- 4 dientes de ajo triturados
- 1 cucharada de mostaza
- Tomillo fresco, romero, sal, pimienta
- Aceite de oliva

## Preparación

1. Marina los medallones con jugo de naranja, panela, ajo, mostaza, hierbas y sal. Reposa 30 min mínimo (idealmente 2h).
2. Calienta una sartén con aceite, sella los medallones 3 min por lado.
3. Agrega el resto de marinada, baja el fuego, tapa y cocina 8 min más.
4. Destapa, deja reducir la salsa 3 min.
5. Sirve con puré de papa criolla amarilla o arroz con coco.

## Consejo

Usa lomo fresco (no congelado) para mayor jugosidad. El cerdo debe llegar a 63°C interno — no más.`
  },
  {
    title: 'Pollo Sudado con Papas',
    summary: 'Clásico almuerzo colombiano: presas de pollo cocinadas en hogao con papas criollas y arveja. Casa y sabor de abuela.',
    cover: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=1200&q=80&auto=format&fit=crop',
    duration: 45,
    difficulty: 'facil',
    md: `## Ingredientes (para 4 personas)

- 1 pollo troceado en 8 presas (2 kg)
- 1 kg de papa criolla
- 1 taza de arveja
- 2 tomates rojos
- 1 cebolla larga
- 1 cebolla cabezona
- 4 dientes de ajo
- Azafrán o color, comino, cilantro, sal, pimienta

## Preparación

1. Sazona el pollo con ajo, sal, pimienta, comino y color. Reposa 15 min.
2. En una olla, sofríe las cebollas, agrega tomate rallado y haz el hogao (10 min).
3. Incorpora el pollo, dora por todos lados 5 min.
4. Añade 1 taza de agua, tapa y cocina 15 min.
5. Agrega las papas criollas peladas y la arveja. Cocina 15 min más hasta que la papa esté tierna.
6. Termina con cilantro picado.
7. Sirve con arroz blanco y tajadas de plátano maduro.

## Consejo

Para un sabor más intenso, dora el pollo primero con piel y usa un poquito de caldo concentrado al final.`
  },
  {
    title: 'Mute Santandereano',
    summary: 'Sopa espesa de maíz, carnes variadas, garbanzos, arveja y callo. Santandereana tradicional, perfecta para días fríos.',
    cover: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80&auto=format&fit=crop',
    duration: 240,
    difficulty: 'dificil',
    md: `## Ingredientes (para 6 personas)

- 300 g de maíz blanco pelado (remojado la noche anterior)
- 500 g de callo de res limpio
- 500 g de carne de res para sopa
- 300 g de costilla de cerdo
- 200 g de garbanzos remojados
- 1 taza de arveja
- 2 papas pastusas
- 2 zanahorias
- 1 cebolla cabezona, 2 cebollas largas
- Cilantro, comino, sal

## Preparación

1. Cocina el maíz 2 horas en olla a presión hasta reventar.
2. En otra olla cocina el callo 1 hora (cambia el agua 2 veces para limpiar).
3. En una olla grande hierve la carne de res y costilla de cerdo con cebollas y ajo (45 min).
4. Mezcla el maíz cocido, el callo, las carnes con su caldo y los garbanzos. Cocina 30 min.
5. Agrega papas, zanahoria, arveja, cilantro. Cocina 20 min.
6. Rectifica sal y comino.
7. Sirve caliente con aguacate y limón.

## Consejo

Mute es sopa de paciencia — no apures la cocción. El día anterior puedes cocinar maíz y callo, al otro día se arma rápido.`
  },
  {
    title: 'Lechona Tolimense',
    summary: 'Cerdo relleno de arroz, arveja y carne, cocinado por horas al horno. Plato festivo del Tolima.',
    cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    duration: 360,
    difficulty: 'dificil',
    md: `## Ingredientes (para una lechona pequeña)

- 1 lechón de 8 kg limpio y destripado
- 500 g de arroz
- 500 g de arveja seca remojada
- 500 g de carne de cerdo en cubos
- 3 cebollas, 6 dientes de ajo, 4 tallos de cebolla larga
- Hierbas: poleo, tomillo, laurel, comino
- Sal, pimienta

## Preparación (versión casera resumida)

1. Un día antes: sazona el lechón por dentro y por fuera con ajo, sal, comino, pimienta, hierbas. Deja en nevera.
2. Cocina el arroz al dente (que no se pase) con el caldo donde cocinaste las arvejas.
3. Sofríe cebollas + cubos de carne hasta dorar. Mezcla con arroz + arvejas.
4. Rellena el lechón, cose la abertura con hilo de cocina.
5. Hornea a 160°C durante 4-6 horas, rociando con su grasa cada hora. La piel debe quedar dorada y crocante.
6. Deja reposar 20 min antes de trinchar.
7. Sirve con arepa blanca y guarapo de panela.

## Consejo

Esto es un plato para festividad/evento. Si no tienes horno grande, pide una pierna de cerdo de 3 kg rellena — más manejable.`
  },
  {
    title: 'Mondongo Antioqueño',
    summary: 'Sopa de callo de res con verduras, papas y maíz. Comida reconstituyente colombiana por excelencia.',
    cover: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80&auto=format&fit=crop',
    duration: 180,
    difficulty: 'media',
    md: `## Ingredientes (para 6 personas)

- 1 kg de callo de res limpio
- 500 g de carne de cerdo (costilla o lomo)
- 2 chorizos
- 3 zanahorias
- 3 papas criollas
- 3 papas pastusas
- 1 taza de arveja verde
- 1 plátano verde
- 1 mazorca tierna
- Cebolla, ajo, tomate, cilantro, comino, sal

## Preparación

1. Lava el callo con limón y sal. Hierve 1.5 horas en abundante agua (cambia el agua 2 veces).
2. Corta el callo en cuadros pequeños. Reserva.
3. En otra olla cocina el cerdo, chorizo y hogao (cebolla, ajo, tomate). Añade el callo.
4. Agrega las verduras en orden: plátano y mazorca primero (20 min), luego papas y zanahoria (15 min), arveja al final (8 min).
5. Agrega comino y sal al gusto. Termina con cilantro.
6. Sirve con aguacate, limón y arroz blanco aparte.

## Consejo

Pídele al carnicero el callo ya limpio y cortado — te ahorra 30 min. En Avisander lo entregamos así.`
  },
  {
    title: 'Cabrito al Horno Santandereano',
    summary: 'Cabrito marinado con cerveza y hierbas, asado lentamente. Plato emblemático del Valle del Río Chicamocha.',
    cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    duration: 150,
    difficulty: 'media',
    md: `## Ingredientes (para 6 personas)

- 1 cabrito mediano (3-4 kg) en presas
- 2 cervezas
- 8 dientes de ajo
- 3 cebollas largas
- Jugo de 4 limones
- Orégano, tomillo, comino, pimienta, sal
- Aceite de oliva

## Preparación

1. Marina el cabrito con cerveza, ajo picado, limón, hierbas y sal por 4-6 horas (mejor toda la noche).
2. Precalienta el horno a 180°C.
3. Coloca las presas en una bandeja con la marinada encima.
4. Hornea 1 hora tapado con papel aluminio.
5. Destapa y hornea 30 min más rociando con su jugo hasta que dore.
6. Sirve con pepitoria (bebida santandereana con sangre y arroz) y yuca o arepa.

## Consejo

El cabrito pesca temperaturas: 70°C interno máximo. Pasa de ahí y se seca.`
  },
  {
    title: 'Costillas BBQ a la Colombiana',
    summary: 'Costillas de cerdo glaseadas con panela, vinagre y ají. Dulces, picantes y fáciles de hacer.',
    cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    duration: 120,
    difficulty: 'facil',
    md: `## Ingredientes (para 4 personas)

- 1.5 kg de costillas de cerdo en tiras
- 1/2 taza de panela rallada
- 1/4 taza de vinagre blanco
- 3 cucharadas de salsa de tomate casera
- 2 cucharadas de mostaza
- 4 dientes de ajo
- 1 cucharada de ají amarillo colombiano
- Sal, pimienta

## Preparación

1. Mezcla panela, vinagre, salsa tomate, mostaza, ajo, ají en una olla. Cocina 5 min hasta espesar. Esa es tu salsa BBQ.
2. Salpimenta las costillas. Hornea 40 min a 180°C tapadas con aluminio.
3. Destapa, unta con la salsa BBQ.
4. Hornea 30 min más destapadas, bañando cada 10 min con más salsa.
5. Los últimos 5 min, sube a 220°C para dorar.
6. Sirve con papa chorreada y arepa.

## Consejo

Para obtener ese glaseado oscuro y pegajoso, baña con salsa mínimo 3 veces durante los últimos 20 min de horneado.`
  }
]

console.log('── Borrando recetas anteriores (en inglés de TheMealDB) ──')
const delResult = db.prepare('DELETE FROM recipes').run()
console.log(`  · ${delResult.changes} recetas eliminadas`)

console.log('\n── Sembrando recetas colombianas auténticas ──')
const insert = db.prepare(
  `INSERT INTO recipes (slug, title, summary, cover_image_url, video_url, body_markdown, duration_min, difficulty, is_published)
   VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 1)`
)

for (const r of RECETAS) {
  const slug = uniqueSlug(db, r.title)
  insert.run(slug, r.title, r.summary, r.cover, r.md, r.duration, r.difficulty)
  console.log(`  ✓ ${r.title}`)
}

console.log(`\n✅ ${RECETAS.length} recetas colombianas listas para servir`)
