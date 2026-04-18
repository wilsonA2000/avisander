const { db } = require('../db/database')

const updates = [
  {
    slug: 'pollo-sudado-con-papas',
    body: `## Sobre este plato

El pollo sudado con papas es uno de los almuerzos más pedidos en los hogares colombianos. Pollo cocinado lento en su propio jugo con un sofrito espeso, papas que absorben todo el sabor y un caldillo que pide arroz blanco para acompañar. Es el plato de los miércoles, cuando uno quiere algo honesto y contundente.

## Ingredientes (para 4 personas)

- 8 presas de pollo (mezcla de muslos y contramuslos con piel)
- 6 papas pastusas medianas, peladas y partidas en cuartos
- 3 tomates chonto maduros rallados
- 1 cebolla cabezona mediana picada fina
- 3 tallos de cebolla larga picados
- 4 dientes de ajo machacados
- 1 pimentón rojo picado
- 1 cucharadita de color o achiote
- 1 cucharadita de comino molido
- 2 hojas de laurel
- 1 cucharada de cilantro fresco picado
- 1 taza de caldo de pollo (o agua con 1 cubo)
- 3 cucharadas de aceite vegetal
- Sal y pimienta al gusto

## Preparación

1. **Sazonar el pollo**. Seca bien las presas con papel de cocina. Frótalas con sal, pimienta y la mitad del comino. Deja reposar 10 minutos para que tome la sal.

2. **Sellar las presas**. Calienta el aceite en una olla o caldero amplio a fuego medio-alto. Dora las presas por tandas, 3 minutos por cada lado, hasta que la piel quede dorada. Reserva aparte tapadas.

3. **Hacer el sofrito**. En la misma olla con la grasa del pollo, sofríe la cebolla cabezona 3 minutos, agrega el ajo y cocina 1 minuto más (sin quemar). Incorpora cebolla larga y pimentón, sofríe 3 minutos.

4. **Añadir el tomate y color**. Integra el tomate rallado, color, resto del comino y laurel. Cocina a fuego medio 8-10 minutos hasta que el tomate se deshaga y el sofrito tome consistencia de salsa espesa. Rectifica sal.

5. **Regresar el pollo**. Devuelve las presas a la olla con los jugos que hayan soltado. Vierte el caldo de pollo, revuelve para cubrir todas las presas y tapa.

6. **Cocción lenta del pollo**. Baja el fuego a medio-bajo y cocina tapado 20 minutos. El pollo suelta jugos y se hace tierno.

7. **Incorporar las papas**. Agrega las papas en cuartos acomodándolas entre las presas para que se cubran con el caldo. Tapa de nuevo y cocina 20 minutos más hasta que las papas estén tiernas (se atraviesen fácil con el tenedor) pero enteras.

8. **Terminar**. Destapa, rectifica sal, espolvorea cilantro fresco y deja reposar tapado 5 minutos antes de servir. El caldo debe quedar espeso, no aguado.

## Tip del cocinero

Para que las papas no se deshagan, elige pastusas firmes sin brotes y no las muevas con la cuchara cuando ya estén en la olla. Si prefieres un sudado más oscuro, agrega una cucharadita de panela rallada al sofrito: le da color y un toque dulce apenas perceptible.

## Para acompañar

- Arroz blanco recién hecho
- Tajadas de plátano maduro fritas
- Aguacate Hass en rodajas
- Limón partido
- Ají pique casero`,
  },

  {
    slug: 'bandeja-paisa',
    body: `## Sobre este plato

La bandeja paisa es el emblema gastronómico de Antioquia y una de las tres comidas más reconocidas de Colombia. No es un plato único sino una composición: fríjoles, arroz, carne molida, chicharrón, chorizo, huevo frito, aguacate, arepa, tajadas de plátano maduro y hogao. Un mediodía bien paisa no cabe en un solo plato, por eso se sirve en bandeja.

## Ingredientes (para 4 personas)

### Fríjoles
- 2 tazas de fríjoles rojos cargamanto remojados desde la noche anterior
- 1 hueso de marrano (ojalá con algo de carne)
- 1 zanahoria pelada partida en 3
- 1 tomate y 1/2 cebolla
- 1 cucharadita de comino
- Sal al gusto
- Agua abundante

### Carne molida
- 500 g de carne molida de res (doble molida)
- 1 tomate rallado
- 1/2 cebolla picada fina
- 2 dientes ajo
- Comino, sal y pimienta
- 2 cucharadas de aceite

### Chicharrón
- 400 g de chicharrón de cerdo en tiras
- Sal y agua

### Resto
- 4 chorizos colombianos
- 4 huevos
- 2 plátanos maduros en tajadas
- 2 aguacates Hass maduros
- 4 arepas antioqueñas
- 2 tazas de arroz blanco cocido
- Hogao (tomate, cebolla larga, color)
- Aceite para freír

## Preparación

1. **Cocinar los fríjoles**. En una olla a presión, pon los fríjoles escurridos, el hueso de marrano, zanahoria, tomate y cebolla. Cubre con agua 3 dedos por encima. Tapa y cocina 45 minutos desde que pite. Abre, agrega comino, sal, machaca un poco los fríjoles para espesar y cocina destapado 15 minutos más. (Sin olla a presión: 2-3 horas).

2. **Chicharrón**. Corta en tiras de 5 cm. En una olla pequeña cubre con agua y una pizca de sal. Hierve 10 minutos para ablandar. Escurre. Pasa a sartén gruesa a fuego medio-bajo: la grasa se derrite, ajusta a fuego alto los últimos 8 minutos para que queden dorados y crocantes. Escurre sobre papel.

3. **Carne molida**. Calienta aceite en sartén. Sofríe cebolla 3 minutos, agrega ajo y tomate rallado 5 minutos. Incorpora la carne molida desmenuzándola, comino, sal y pimienta. Cocina 10-12 minutos removiendo hasta que quede seca y oscura.

4. **Chorizo**. Pincha los chorizos con tenedor. Fríelos en sartén con un chorrito de aceite a fuego medio, 4 minutos por lado hasta que doren.

5. **Tajadas**. Pela los plátanos maduros y córtalos en diagonal de 1 cm. Fríe en aceite caliente 2-3 minutos por lado hasta dorar. Escurre.

6. **Huevos**. En sartén aparte fríe los huevos uno a uno con un chorrito de aceite. Yema blanda, clara firme (3 minutos).

7. **Arepa**. Asa las arepas 2 minutos por lado en plancha caliente hasta dorar.

8. **Montaje**. En una bandeja grande sirve el arroz en el centro, los fríjoles a un lado, la carne molida al otro. Ubica el chicharrón, el chorizo cortado en dos, el huevo frito encima del arroz, las tajadas al lado, el aguacate en medialunas, la arepa aparte y unas cucharadas de hogao.

## Tip del maestro carnicero

Para chicharrón paisa pide en Avisander el tocino con 3-4 cm de grasa blanca y 1 cm de carne. Para la carne molida pide doble molida — queda más fina y se dora mejor. El chorizo colombiano tradicional es el santarrosano; si consigues, mejor.

## Para acompañar

- Jugo de mora con leche o limonada de panela
- Suero costeño al lado (opcional)
- Ají pique casero`,
  },

  {
    slug: 'ajiaco-santafereno',
    body: `## Sobre este plato

El ajiaco es el plato insignia de Bogotá y la sabana cundiboyacense. Una sopa espesa de tres papas distintas — criolla, pastusa y sabanera — con pollo desmechado, maíz tierno y un ingrediente que no se reemplaza: las guascas, hierba que le da su aroma único. Se sirve con crema de leche, alcaparras y aguacate aparte para que cada comensal arme su plato.

## Ingredientes (para 6 personas)

- 6 presas de pollo (muslo y contramuslo con hueso)
- 1 kg de papa criolla pelada y partida a la mitad si es grande
- 1 kg de papa pastusa o sabanera en rodajas de 1 cm
- 500 g de papa sabanera (o R12) en rodajas de 1 cm
- 4 mazorcas tiernas partidas en trozos de 3 cm
- 1 manojo grande de guascas secas (o 1 taza si son frescas)
- 2 tallos de cebolla larga
- 4 dientes de ajo machacados
- 2 cucharadas de cilantro fresco (solo las hojas)
- 1 taza de crema de leche
- 1/2 taza de alcaparras pequeñas escurridas
- 2 aguacates Hass maduros
- Sal y pimienta al gusto
- 3 litros de agua

## Preparación

1. **Cocinar el pollo**. En una olla grande pon el pollo, cebolla larga, ajo y agua. Lleva a hervor, reduce a fuego medio y cocina 40 minutos. Espuma cualquier suciedad que suba a la superficie. Retira el pollo, desmenúzalo cuando se enfríe y reserva el caldo.

2. **Cocinar la papa pastusa y sabanera**. Cuela el caldo y devuélvelo a la olla. Agrega las rodajas de papa pastusa y sabanera. Cocina 25 minutos a fuego medio. Las papas deben deshacerse parcialmente: eso es lo que espesa el ajiaco.

3. **Sumar la papa criolla y la mazorca**. Añade la papa criolla y los trozos de mazorca. Cocina 20 minutos más. La papa criolla se debe deshacer casi completamente dando el color amarillo característico.

4. **Incorporar guascas**. En los últimos 5-8 minutos de cocción añade las guascas. No las pongas antes porque se amargan si hierven mucho. Remueve y rectifica sal.

5. **Regresar el pollo**. Incorpora el pollo desmenuzado al ajiaco. Calienta 3 minutos y apaga.

6. **Servir los acompañamientos**. Aparte, en pequeños tazones, dispón la crema de leche, las alcaparras y el aguacate cortado en rodajas.

7. **Montar el plato**. Sirve el ajiaco bien caliente en platos hondos. Cada persona añade a su gusto una cucharada de crema, unas alcaparras y unas rodajas de aguacate. Espolvorea cilantro fresco encima.

## Tip del cocinero

Las guascas son el alma del ajiaco — sin ellas es simplemente una sopa de papas con pollo. Las frescas son más aromáticas pero amargan más rápido; las secas duran más y aguantan mejor la cocción. Si no consigues papa criolla fresca, la congelada funciona igual: se deshace mucho más fácil.

## Para acompañar

- Arroz blanco aparte (tradicional en Bogotá servirlo al lado)
- Pan campesino
- Limonada o jugo de curuba`,
  },

  {
    slug: 'sobrebarriga-a-la-criolla',
    body: `## Sobre este plato

La sobrebarriga es el corte de falda o sobrebarriga delgada de la res — una pieza que, mal cocinada, queda durísima, pero bien tratada se convierte en una carne tan tierna que se desarma con tenedor. La receta criolla la cocina en hogao espeso con cerveza: un clásico santandereano para almuerzo de domingo.

## Ingredientes (para 4 personas)

- 1.5 kg de sobrebarriga de res en un solo trozo
- 3 tomates chonto maduros rallados
- 2 cebollas cabezonas picadas finas
- 4 dientes de ajo machacados
- 1 pimentón rojo picado fino
- 1 cerveza nacional (330 ml, idealmente tipo lager)
- 1 cucharada de panela rallada (o 1 cda azúcar moreno)
- 1 cucharadita de comino molido
- 2 hojas de laurel
- 1 ramita de tomillo fresco
- 1 cucharada de color o achiote
- 3 cucharadas de aceite vegetal
- Sal y pimienta al gusto
- 1 taza de agua

## Preparación

1. **Preparar la carne**. Seca la sobrebarriga con papel de cocina. Retira cualquier nervio fibroso grande y pincha por ambos lados con tenedor para que la marinada penetre. Sazona generosamente con sal y pimienta por ambos lados.

2. **Sellar al golpe**. Calienta 2 cucharadas de aceite en olla grande o caldero. Sella la sobrebarriga 4 minutos por cada lado a fuego alto hasta que forme una costra dorada. Retira y reserva.

3. **Hacer el hogao**. En la misma olla, baja el fuego a medio. Agrega la cucharada restante de aceite y sofríe la cebolla 4 minutos hasta transparente. Incorpora ajo, pimentón y color. Sofríe 3 minutos más.

4. **Espesar con tomate**. Añade el tomate rallado, comino, laurel y tomillo. Cocina removiendo ocasionalmente 12-15 minutos a fuego medio-bajo hasta que el tomate pierda acidez y se integre con la cebolla formando una salsa espesa.

5. **Deglasar con cerveza**. Vierte la cerveza para desprender los jugos del fondo de la olla (los "tostados" dan sabor). Sube el fuego 2 minutos para evaporar el alcohol. Agrega la panela y remueve.

6. **Cocinar la carne**. Regresa la sobrebarriga a la olla acomodándola sobre el hogao. Agrega la taza de agua (o hasta que cubra 2/3 de la carne). Tapa y cocina a fuego muy bajo 2-2.5 horas. Cada 30 minutos voltea la carne con cuidado y añade un poco de agua si se seca.

7. **Verificar el punto**. La sobrebarriga está lista cuando puedes desgarrarla con un tenedor sin esfuerzo. Si no cede, dale otros 30 minutos.

8. **Reducir la salsa**. Retira la carne a una tabla. Con el fuego alto, reduce la salsa de hogao 10-15 minutos hasta que espese. Rectifica sal.

9. **Cortar y servir**. Corta la sobrebarriga en tajadas de 2 cm en contra de la fibra. Acomoda en una fuente y baña con la salsa reducida.

## Tip del maestro carnicero

En Avisander pide la sobrebarriga con una capa de grasa de 4-5 mm por fuera — esa grasa se derrite durante las 2 horas y es la que hace la diferencia entre una carne jugosa y una seca. Si la quieres aún más tierna, pásala 15 minutos al horno a 200°C después de la cocción en olla: la capa externa queda tostada.

## Para acompañar

- Arroz blanco
- Papa chorreada (papa criolla en salsa de queso campesino)
- Yuca cocida o frita
- Aguacate
- Ensalada de tomate y cebolla`,
  },

  {
    slug: 'mondongo-antioqueno',
    body: `## Sobre este plato

El mondongo paisa es una sopa densa y reparadora, tradicional de domingo después de noche larga. Lleva tripa de res (que hay que lavar muy bien y cocinar horas), carne de cerdo, garbanzos, verduras y papa. Se sirve con limón, aguacate y arepa: un plato que abraza por dentro.

## Ingredientes (para 6 personas)

- 500 g de mondongo o panza de res (tripa) limpia, cortada en tiras de 1 cm
- 300 g de tocino de cerdo en cubos
- 200 g de carne de cerdo magra en cubos (pierna o posta)
- 1 chorizo colombiano en rodajas (opcional)
- 1 taza de garbanzos remojados desde la noche anterior (o lata escurrida)
- 2 papas pastusas grandes en cubos de 2 cm
- 1 zanahoria grande en rodajas
- 1 plátano verde pelado en trozos grandes
- 3 tomates chonto rallados
- 2 cebollas cabezonas picadas finas
- 3 tallos de cebolla larga picados
- 4 dientes de ajo machacados
- 2 hojas de laurel
- 1 cucharadita de comino
- 1 cucharadita de color
- 2 cucharadas de cilantro fresco picado + más para servir
- Sal, pimienta
- 3 limones para servir
- 2 aguacates Hass

## Preparación

1. **Lavar el mondongo**. Enjuaga la tripa bajo agua fría varias veces. Frótalo con sal gruesa y limón. Ponlo en una olla con agua fría, 1 limón partido y una cucharadita de vinagre. Hierve 10 minutos. Escurre y desecha esa agua (esto elimina olor).

2. **Primer hervor de la tripa**. Devuelve la tripa a la olla con agua nueva, 1 hoja de laurel y una cebolla entera. Cocina 2 horas a fuego medio en olla normal (o 40 minutos en olla a presión) hasta que esté tierna. Escurre y reserva.

3. **Cocinar los garbanzos**. Si son crudos remojados, cocínalos en olla aparte 1 hora. Si son de lata, solo escúrrelos y reserva.

4. **Hacer el hogao base**. En una olla grande y profunda calienta 2 cucharadas de aceite. Sofríe cebolla cabezona 4 minutos. Agrega cebolla larga, ajo, comino, color y la hoja de laurel restante. Cocina 2 minutos.

5. **Integrar el tomate**. Añade el tomate rallado y cocina 10 minutos a fuego medio hasta que se deshaga.

6. **Incorporar las carnes**. Agrega el tocino y la carne de cerdo. Sofríe 5 minutos hasta dorar ligeramente. Incorpora la tripa cocida y el chorizo.

7. **Hervor largo**. Vierte 2 litros de agua caliente, sal y pimienta. Lleva a hervor, reduce a fuego medio y cocina 40 minutos para que los sabores se integren.

8. **Verduras y papa**. Añade la zanahoria, el plátano verde en trozos y los garbanzos. Cocina 15 minutos. Luego incorpora la papa en cubos y cocina 20 minutos más.

9. **Ajustar y servir**. Rectifica sal, añade cilantro picado y apaga. Deja reposar 5 minutos tapado. Sirve en platos hondos acompañado de limón, aguacate y arepa.

## Tip del cocinero

Un mondongo bien lavado no huele fuerte: insiste con el lavado inicial y el primer hervor con limón. Si te gusta espeso, al final machaca un par de papas con el cucharón. Algunos paisas le agregan arroz cocido al plato directamente — funciona, pero es opcional.

## Para acompañar

- Arepa de maíz blanco
- Limón fresco (el ácido balancea la grasa)
- Aguacate Hass
- Arroz blanco al lado
- Ají pique`,
  },
]

const stmt = db.prepare('UPDATE recipes SET body_markdown = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?')
let count = 0
for (const u of updates) {
  const r = stmt.run(u.body, u.slug)
  if (r.changes) count++
}
console.log(`✓ Lote 2: ${count}/${updates.length} recetas (pollo sudado + 4 almuerzos grandes)`)
