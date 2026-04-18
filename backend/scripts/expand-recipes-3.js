const { db } = require('../db/database')

const updates = [
  {
    slug: 'arroz-con-pollo-colombiano',
    body: `## Sobre este plato

El arroz con pollo es ese plato que aparece en toda reunión familiar colombiana: cumpleaños, almuerzos de domingo, comidas de oficina. Arroz amarillo bien sazonado, pollo desmechado, zanahoria, arveja y maíz tierno. Se sirve con tajada, aguacate y ensalada: el almuerzo completo.

## Ingredientes (para 6 personas)

- 1 pollo entero partido en presas (o 6 muslos)
- 3 tazas de arroz blanco de grano largo
- 5 tazas de caldo de pollo caliente
- 1 zanahoria grande en cubos pequeños
- 1 taza de arveja fresca o congelada
- 1 taza de maíz tierno desgranado
- 1 pimentón rojo picado fino
- 1 pimentón verde picado fino (opcional)
- 2 tomates chonto rallados
- 1 cebolla cabezona picada
- 3 tallos de cebolla larga picados
- 3 dientes de ajo machacados
- 1 cucharada rasa de color o achiote
- 1 cubo de caldo de gallina
- 1 cucharadita de comino
- 2 hojas de laurel
- 4 cucharadas de aceite vegetal
- Sal y pimienta al gusto

## Preparación

1. **Cocinar el pollo**. En olla grande pon las presas con 6 tazas de agua, la mitad de la cebolla cabezona, 1 tallo de cebolla larga, 1 diente de ajo y sal. Hierve 30 minutos tapado. Retira las presas, desmenuza la carne y reserva. Cuela el caldo y guárdalo caliente.

2. **Sofrito base**. En una olla amplia (o caldero) calienta 3 cucharadas de aceite a fuego medio. Sofríe el resto de la cebolla cabezona 3 minutos, agrega cebolla larga, ajo y pimentones. Cocina 4 minutos más removiendo.

3. **Tomate y color**. Incorpora el tomate rallado, color, comino y laurel. Cocina 8 minutos a fuego medio-bajo hasta que se forme un hogao espeso y el aceite comience a separarse.

4. **Sumar las verduras**. Agrega la zanahoria, arveja y maíz. Sofríe 3 minutos removiendo para que tomen el sabor del hogao.

5. **Tostar el arroz**. Añade el arroz crudo directo a la olla. Remueve 2 minutos para que cada grano se impregne del sofrito. Este paso es lo que diferencia un arroz con pollo bueno de uno plano.

6. **Agregar caldo y cocinar**. Vierte el caldo caliente (5 tazas), el cubo desmoronado y rectifica sal. Remueve una vez, tapa y baja el fuego a mínimo. Cocina 18 minutos sin destapar.

7. **Integrar el pollo**. Destapa, revuelve con tenedor soltando los granos e incorpora el pollo desmenuzado. Tapa de nuevo y cocina 5 minutos más a fuego muy bajo.

8. **Reposar**. Apaga y deja reposar tapado 10 minutos. Este reposo termina de cocinar el arroz y lo deja perfectamente suelto.

## Tip del cocinero

La proporción exacta es 5 tazas de líquido por 3 de arroz. Si el grano tuyo absorbe más, usa 5 y 1/2. Nunca destapes antes de los 18 minutos: cada destape pierde vapor y el arroz queda apelmazado.

## Para acompañar

- Tajadas de plátano maduro frito
- Aguacate Hass en rodajas
- Ensalada de lechuga, tomate y cebolla morada
- Ají pique casero
- Papas a la francesa (para niños)`,
  },

  {
    slug: 'albondigas-salsa-criolla',
    body: `## Sobre este plato

Las albóndigas en salsa criolla son uno de esos almuerzos de entre semana que parecen sencillos pero hacen sentir a cualquiera en casa. Bolas tiernas de carne molida bañadas en hogao con tomate y pimentón. Se sirven con arroz y tajada: el trío clásico.

## Ingredientes (para 4 personas)

### Para las albóndigas
- 500 g de carne molida de res (doble molida)
- 1 huevo grande
- 1/2 taza de miga de pan remojada en 3 cucharadas de leche
- 1/4 de cebolla cabezona picada muy fina
- 1 diente de ajo machacado
- 2 cucharadas de perejil fresco picado
- 1 cucharadita de comino
- 1 cucharadita de sal
- 1/2 cucharadita de pimienta
- 2 cucharadas de aceite para dorar

### Para la salsa criolla
- 3 tomates chonto maduros rallados
- 1 cebolla cabezona picada fina
- 2 tallos de cebolla larga picados
- 1 pimentón rojo picado en cubos pequeños
- 3 dientes de ajo machacados
- 1 cucharadita de color
- 1/2 cucharadita de orégano seco
- 1 cucharadita de panela rallada
- 1 taza de caldo de res o agua
- 2 cucharadas de aceite

## Preparación

1. **Preparar la masa**. Pon la miga de pan con la leche en un tazón 5 minutos hasta que absorba todo. En otro tazón mezcla carne, huevo, cebolla fina, ajo, perejil, comino, sal y pimienta. Agrega la miga remojada y mezcla con las manos sin amasar demasiado (si amasas mucho quedan duras).

2. **Formar las albóndigas**. Humedece tus manos con agua fría. Toma porciones del tamaño de una nuez grande (30 g aprox) y rueda entre las palmas formando bolas. Te deben salir unas 16-20. Reserva en un plato.

3. **Dorar las albóndigas**. Calienta 2 cucharadas de aceite en sartén amplia a fuego medio-alto. Dora las albóndigas por tandas (sin amontonar) girándolas cada 2 minutos hasta que estén doradas por todos los lados (6-7 minutos totales). No tienen que estar cocinadas por dentro, solo selladas. Reserva.

4. **Sofrito para la salsa**. En la misma sartén, baja a fuego medio. Agrega 2 cucharadas de aceite. Sofríe la cebolla cabezona 3 minutos, agrega cebolla larga, ajo y pimentón. Cocina 4 minutos.

5. **Salsa espesa**. Incorpora el tomate rallado, color, orégano y panela. Cocina 10 minutos removiendo hasta que se forme una salsa espesa y el aceite se asome en los bordes.

6. **Cocinar las albóndigas en salsa**. Vierte el caldo, lleva a hervor suave y regresa las albóndigas a la sartén acomodándolas para que queden sumergidas en la salsa. Tapa y cocina 15 minutos a fuego bajo girándolas a la mitad del tiempo.

7. **Terminar**. Destapa, prueba y rectifica sal. Si la salsa está muy líquida, deja cocinar 5 minutos más destapado. La consistencia ideal es de napa: que cubra el dorso de una cuchara.

## Tip del cocinero

Un truco viejo: añade 1 cucharadita de mostaza a la masa de carne. Le da jugosidad y un sabor más redondo sin que se note el ingrediente. Si las quieres aún más tiernas, reemplaza la leche por yogur natural.

## Para acompañar

- Arroz blanco (esencial)
- Tajadas de plátano maduro
- Aguacate Hass
- Ensalada verde
- Papas cocidas (alternativa)`,
  },

  {
    slug: 'costilla-desmechada',
    body: `## Sobre este plato

La costilla desmechada es el truco del almuerzo estrella: pides costilla en vez de posta y con un poco más de tiempo de cocción obtienes una carne de fibras tiernas que se desarman en hogao. Se sirve con arroz y aguacate.

## Ingredientes (para 6 personas)

- 1.5 kg de costilla de res con bastante carne (punta de chuleta o costilla ancha)
- 2 cebollas cabezonas grandes picadas
- 4 tallos de cebolla larga
- 6 dientes de ajo machacados
- 4 tomates chonto maduros rallados
- 1 pimentón rojo picado
- 2 zanahorias medianas (1 entera, 1 picada)
- 1 taza de cerveza o vino tinto seco
- 2 hojas de laurel
- 1 ramita de tomillo
- 1 cucharadita de comino
- 1 cucharadita de color
- 1 cucharada de panela rallada
- Sal, pimienta
- 3 cucharadas de aceite vegetal
- Cilantro fresco para servir

## Preparación

1. **Sazonar la costilla**. Seca la carne con papel de cocina. Frota con sal, pimienta y la mitad del comino. Deja reposar 15 minutos.

2. **Sellar**. Calienta 2 cucharadas de aceite en olla a presión (o caldero grande). Dora la costilla por tandas 4 minutos por cada lado a fuego alto hasta que quede bien dorada. Reserva.

3. **Hogao base**. Baja a fuego medio. Agrega 1 cucharada de aceite, sofríe cebolla cabezona 4 minutos, agrega cebolla larga, ajo, pimentón y zanahoria picada. Cocina 5 minutos.

4. **Tomate y especias**. Incorpora tomate rallado, color, resto del comino, laurel y tomillo. Cocina 10 minutos removiendo ocasionalmente hasta que el tomate se deshaga y el aceite se asome.

5. **Deglasar y añadir carne**. Vierte la cerveza (o vino) raspando el fondo para despegar los tostados. Deja evaporar 2 minutos. Regresa la costilla con sus jugos, agrega la zanahoria entera, la panela y agua hasta cubrir 3/4 de la carne.

6. **Cocción en presión**. Tapa la olla a presión. Cocina 60 minutos desde que pita a fuego medio-bajo (en olla normal: 3-3.5 horas a fuego muy bajo con olla tapada, añadiendo agua si se seca).

7. **Enfriar y desmechar**. Abre la olla cuando baje la presión. Retira la costilla y déjala templar 10 minutos. Con dos tenedores o las manos (con guantes), separa la carne de los huesos y desmenuza en hebras. Desecha los huesos y la zanahoria entera.

8. **Reducir la salsa**. Cuela la salsa si prefieres textura lisa (opcional). Regresa la salsa a la olla, ponla a fuego alto 10 minutos destapada hasta que espese. Devuelve la carne desmechada, mezcla bien y cocina 3 minutos más para que la carne absorba el sabor.

9. **Servir**. Sirve con cilantro picado encima y arroz al lado.

## Tip del maestro carnicero

Pide en Avisander costilla de res "para desmechar" o "ancha con carne" — la costilla flaca no rinde. El secreto es que debe tener una capa visible de grasa entre los huesos: esa grasa es la que da sabor y se integra a la salsa durante las 3 horas.

## Para acompañar

- Arroz blanco recién hecho
- Aguacate Hass
- Papa chorreada o papa criolla frita
- Arepa de maíz blanco
- Ensalada de tomate y cebolla morada`,
  },
]

const stmt = db.prepare('UPDATE recipes SET body_markdown = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?')
let count = 0
for (const u of updates) {
  const r = stmt.run(u.body, u.slug)
  if (r.changes) count++
}
console.log(`✓ Lote 3: ${count}/${updates.length} (almuerzos restantes)`)
