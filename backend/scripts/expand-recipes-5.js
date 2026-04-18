const { db } = require('../db/database')

const updates = [
  {
    slug: 'ribeye-chimichurri',
    body: `## Sobre este plato

El ribeye es el corte estrella para quien disfruta la carne por la carne. Marmoleado, jugoso y con sabor profundo. Sellado al punto y terminado con chimichurri casero, es lo más cerca que vas a estar de una parrilla argentina sin salir de casa.

## Ingredientes (para 2 personas)

### Carne
- 2 ribeyes de 300-350 g cada uno, 2.5 cm de grosor mínimo
- Sal gruesa marina
- Pimienta negra recién molida
- 1 cucharada de aceite neutro (girasol o canola)
- 1 cucharada de mantequilla sin sal
- 2 ramitas de tomillo fresco
- 2 dientes de ajo aplastados pero enteros

### Chimichurri clásico
- 1 taza de perejil fresco picado muy fino (solo las hojas)
- 1/2 taza de cilantro fresco picado fino
- 5 dientes de ajo picados muy fino
- 1 cucharada rasa de orégano seco
- 1/2 taza de aceite de oliva extra virgen
- 3 cucharadas de vinagre de vino tinto
- 1/2 cucharadita de ají en hojuelas (al gusto)
- 1 cucharadita de sal fina
- Pimienta negra al gusto

## Preparación

1. **Atemperar la carne**. Saca los ribeyes del refrigerador 40 minutos antes de cocinar. Deben estar a temperatura ambiente. Seca muy bien con papel. Si tienen cordón (ese tejido blanco), no lo retires: se retrae al dorarse y da sabor.

2. **Preparar el chimichurri**. Pica el perejil, cilantro y ajo muy finos (no uses procesador, el chimichurri debe quedar rústico). Mezcla en un recipiente con orégano, vinagre, aceite, ají, sal y pimienta. Deja reposar mínimo 15 minutos para que se integren los sabores.

3. **Sazonar al minuto**. Justo antes de poner la carne en la sartén, espolvorea sal gruesa abundante y pimienta por ambos lados. No sales antes porque la sal extrae jugos.

4. **Calentar la sartén**. Usa una sartén de hierro colado o una plancha gruesa. Ponla a fuego alto 4 minutos hasta que humee levemente. Añade el aceite neutro y espera 20 segundos.

5. **Sellado perfecto**. Pon los ribeyes en la sartén sin moverlos 3-4 minutos. Escucharás un chisporroteo intenso. Cuando se despegan solos del fondo, es hora de voltearlos.

6. **Voltear y aromatizar**. Voltea con pinzas (no con tenedor: perfora la carne). Agrega la mantequilla, el tomillo y los ajos aplastados. Inclina la sartén y con cuchara baña los ribeyes con la mantequilla aromática 2-3 minutos. A esto los franceses le dicen "arroser".

7. **Punto de cocción**. Para término medio-bajo (rosado al centro): 3 minutos del segundo lado. Para medio (jugoso con leve rosa): 4 minutos. Para término medio-alto: 5 minutos. Un termómetro marca 54°C para medio.

8. **Reposo sagrado**. Pasa los ribeyes a una tabla tibia. Cubre con papel aluminio sin ajustar y deja reposar 5 minutos. Mientras reposan, los jugos se redistribuyen.

9. **Servir**. Corta los ribeyes enteros o en tiras gruesas siguiendo la fibra. Pon el chimichurri en un tazón aparte para que cada comensal se sirva al gusto. Espolvorea sal gruesa maldon encima justo antes de servir.

## Tip del maestro carnicero

El ribeye premium tiene marmoleado (vetas de grasa blancas dentro del músculo rojo). Esa grasa es la que da sabor — cuanto más marmoleado, más jugoso. Pide en Avisander ribeye "bien marmoleado" y de 2.5 cm de grosor como mínimo: más delgado se sobrecocina en segundos.

## Para acompañar

- Papas bravas o papas al rescoldo
- Ensalada de rúcula con queso parmesano
- Vino tinto Malbec o Cabernet
- Pan rústico tostado
- Mantequilla Maître d'Hôtel (con perejil y limón) como alternativa al chimichurri`,
  },

  {
    slug: 'solomito-salsa-vino',
    body: `## Sobre este plato

El solomito (o solomillo) de res es el corte más tierno que existe — casi no tiene grasa y se puede cortar con tenedor. Preparado en medallones con una reducción de vino tinto y mantequilla, es un plato que se ve en restaurantes caros pero se hace en casa en 45 minutos.

## Ingredientes (para 4 personas)

- 4 medallones de solomito de 180-200 g, 3 cm de grosor
- 2 cucharadas de mantequilla + 4 cubos fríos para terminar
- 2 cucharadas de aceite neutro
- 1 chalota grande (o 1/3 de cebolla blanca) picada muy fina
- 2 dientes de ajo machacados
- 1 taza de vino tinto seco (Malbec, Cabernet o Syrah)
- 1/2 taza de caldo de res concentrado
- 1 cucharada de vinagre balsámico
- 1 ramita de tomillo fresco
- 1 hoja pequeña de laurel
- Sal gruesa y pimienta negra
- Cebollín picado fino para decorar

## Preparación

1. **Atemperar y sazonar**. Saca los medallones del refrigerador 30 minutos antes. Seca muy bien. Sazona generosamente con sal gruesa y pimienta presionando para que se adhieran.

2. **Sellar a fuego alto**. Calienta una sartén de hierro a fuego alto con el aceite hasta que humee apenas. Pon los medallones sin mover 3 minutos por lado para término medio (centro rosado). Trabaja en tandas si la sartén es pequeña: no amontonar.

3. **Reservar tapados**. Retira los medallones a un plato precalentado y cúbrelos con papel aluminio sin ajustar. Seguirán cocinándose un poco con el calor residual mientras haces la salsa.

4. **Sofrito aromático**. Baja el fuego a medio. En la misma sartén con los jugos sofríe la chalota 2 minutos hasta transparentar. Agrega el ajo y cocina 30 segundos más sin quemar.

5. **Deglasar con vino**. Vierte el vino tinto raspando el fondo con cuchara de madera para desprender los tostados (esos jugos dorados son oro). Agrega tomillo y laurel.

6. **Reducir**. Sube a fuego medio-alto. Reduce el vino a la mitad, aproximadamente 5-6 minutos. La salsa debe haber perdido el olor alcohólico y concentrado los sabores.

7. **Caldo y balance**. Agrega el caldo de res y el vinagre balsámico. Continúa reduciendo otros 5-6 minutos hasta que la salsa nape una cuchara (al levantarla debe cubrirla con una capa fina).

8. **Colar (opcional)**. Si quieres una salsa pulida, pásala por colador fino presionando con cuchara. Para casa, puedes dejarla con los trozos de chalota.

9. **Montar con mantequilla**. Baja el fuego al mínimo. Agrega los 4 cubos de mantequilla fría uno a uno, moviendo la sartén en círculos (no batas con cuchara, se corta). La salsa toma brillo y textura aterciopelada.

10. **Servir**. Pon 2-3 cucharadas de salsa en el fondo del plato. Encima el medallón de solomito. Corona con más salsa si quieres y espolvorea cebollín fresco picado.

## Tip del maestro carnicero

El solomito tiene tres partes: el centro (la parte más gruesa y perfecta para medallones), la cabeza (más grande, para 2 porciones) y la cola (fina, ideal para stroganoff). Pide en Avisander medallones "del centro" y de 3 cm — delgados quedan secos.

## Para acompañar

- Puré de papa sedoso con mantequilla
- Espárragos a la plancha
- Risotto de hongos
- Papas gratinadas
- Vino tinto del mismo que usaste para la salsa`,
  },

  {
    slug: 'tbone-parrilla-mantequilla-hierbas',
    body: `## Sobre este plato

El T-Bone es una carne que impresiona apenas la pones en la mesa: un hueso en forma de T divide dos cortes distintos — el solomito (suave) por un lado y el bife angosto (más sabor) por el otro. A la parrilla con mantequilla de hierbas derritiéndose encima es una experiencia difícil de olvidar.

## Ingredientes (para 2 personas)

### Carne
- 1 T-Bone de 800-900 g, 3-4 cm de grosor
- Sal gruesa marina
- Pimienta negra en grano recién molida
- 1 cucharada de aceite neutro (si se hace a la sartén)

### Mantequilla compuesta
- 120 g de mantequilla sin sal a temperatura ambiente
- 2 dientes de ajo rallados
- 2 cucharadas de perejil fresco picado muy fino
- 1 cucharada de tomillo fresco picado
- 1 cucharadita de romero fresco picado
- 1 cucharada de cebollín picado
- Ralladura de 1/2 limón
- 1/2 cucharadita de sal fina
- 1/4 cucharadita de pimienta

## Preparación

1. **Preparar la mantequilla compuesta (puede hacerse con horas de anticipación)**. En un tazón mezcla con tenedor la mantequilla con ajo, hierbas, ralladura de limón, sal y pimienta hasta integrar completamente. Pon la mezcla sobre papel film y forma un cilindro de 3 cm de diámetro envolviéndola. Refrigera mínimo 30 minutos (o hasta días antes).

2. **Atemperar la carne**. Saca el T-Bone del refrigerador 45 minutos antes. Un T-Bone frío en la parrilla es garantía de centro crudo y exterior quemado. Seca muy bien con papel de cocina.

3. **Sazonar generoso**. Frota ambos lados con sal gruesa abundante y pimienta negra. La sal llevará a una salmuera natural que sazona por dentro. Deja reposar 15 minutos mientras preparas la parrilla.

4. **Parrilla al carbón (método ideal)**. Prende la parrilla hasta que las brasas estén blancas/grises (unos 30-40 minutos antes). Divide las brasas: una mitad con más brasas (zona caliente), otra mitad con menos (zona moderada).

5. **Sellar en zona caliente**. Pon el T-Bone sobre la zona de máximo calor. Sella sin mover 3 minutos por lado para formar la marca y la costra dorada. Gira 90 grados a la mitad del tiempo para hacer las marcas de parrilla cruzadas.

6. **Terminar en zona moderada**. Mueve el T-Bone a la zona de fuego indirecto. Tapa la parrilla (o cubre holgadamente con una cacerola inversa). Cocina 6-8 minutos más para término medio — 54°C en el centro del bife (no junto al hueso, que calienta diferente).

7. **En sartén (alternativa)**. Si no tienes parrilla, usa sartén de hierro muy caliente con 1 cucharada de aceite. Sella 4 minutos por lado. Luego termina en horno a 200°C 5-7 minutos según el grosor.

8. **Reposo crítico**. Retira a una tabla de madera tibia, cubre con papel aluminio holgadamente. Reposo de 8 minutos como mínimo (esta carne grande necesita más que otros cortes). Los jugos se redistribuyen.

9. **Servir con la mantequilla**. Acomoda el T-Bone entero sobre la tabla. Corta una rodaja gruesa (1.5 cm) de la mantequilla compuesta fría y ponla en el centro de la carne caliente. Se derrite lentamente bañando todo. Sirve con cuchillo para que cada comensal corte su porción del lado que prefiera.

## Tip del maestro carnicero

El T-Bone tiene dos cortes diferentes: el solomito (lado pequeño de la T) se cocina más rápido que el bife (lado grande). Para parejo, pon el T-Bone con el solomito hacia la zona más fría. Pide en Avisander T-Bone "de 3 cm mínimo" — los delgados no permiten sellar bien sin sobrecocinar.

## Para acompañar

- Papas al rescoldo (envueltas en aluminio en las brasas)
- Ensalada de tomate asado y cebolla morada
- Maíz tierno a la brasa con mantequilla
- Pan rústico tostado en la parrilla
- Vino tinto con cuerpo (Malbec, Cabernet Sauvignon)`,
  },
]

const stmt = db.prepare('UPDATE recipes SET body_markdown = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?')
let count = 0
for (const u of updates) {
  const r = stmt.run(u.body, u.slug)
  if (r.changes) count++
}
console.log(`✓ Lote 5: ${count}/${updates.length} (gourmet parte 1)`)
