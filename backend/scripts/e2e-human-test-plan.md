# Plan de verificación E2E — Avisander (como humano)

**Fecha de creación:** 2026-04-16
**Sprint cubierto:** 8 (WhatsApp etiquetas, fidelización, dashboard, export Excel) + sprint anterior (Bold, galería, descuentos, tipografía, iconos)

## Pre-requisitos

```bash
# 1. Matar zombies
pkill -f "node --watch server.js" 2>/dev/null; pkill -f "node server.js" 2>/dev/null; true

# 2. Levantar backend
cd /home/wilsonadmin/avisander/avisander/backend && node server.js &

# 3. Levantar frontend
cd /home/wilsonadmin/avisander/avisander/frontend && npx vite --host --port 5173 &

# 4. Credenciales
# Admin: admin@avisander.com / admin123
# Crear usuario test nuevo en cada corrida para probar descuento 1ª compra
```

---

## BLOQUE 1: Público — Home y navegación

### 1.1 Home — Popup de bienvenida
- [ ] Ir a http://localhost:5173/ (limpiar cookies antes)
- [ ] Verificar: popup modal aparece con imagen de carnes + "¡Bienvenido a Avisander!"
- [ ] Verificar: subtítulo "10% OFF en tu primer pedido"
- [ ] Verificar: botón naranja "Ver catálogo" + "Más tarde"
- [ ] Cerrar popup con X o "Más tarde"
- [ ] **Visual:** popup NO se corta arriba (max-h-[90vh])

### 1.2 Home — Tipografía y diseño
- [ ] Verificar: "Carnicería premium, cortes perfectos" en tipografía Fraunces (serif elegante)
- [ ] Verificar: texto general en Manrope (sans moderna)
- [ ] Verificar: Hero con CTA "Ver catálogo" + "Pedir por WhatsApp"
- [ ] Verificar: secciones "Destacados" y "En oferta" con ProductCarousel
- [ ] Verificar: footer oscuro con 4 columnas (Brand, Sobre Avisander, Explora, Contacto)
- [ ] Verificar: botón flotante WhatsApp verde abajo-derecha con pulse animation
- [ ] **Visual:** nada debe verse "básico" o placeholder

### 1.3 MegaMenu
- [ ] Hover/click "Productos" → dropdown con categorías reales
- [ ] Hover/click "Sobre Avisander" → links a Nosotros, Equipo, Ubicación, Recetas
- [ ] Hover/click "Ayuda" → Centro de ayuda, PQRS
- [ ] Hover/click "Contacto" → teléfono, WhatsApp, horarios, dirección
- [ ] **Visual:** menú limpio, no items rotos o vacíos

---

## BLOQUE 2: Catálogo y producto

### 2.1 Catálogo /productos
- [ ] Ir a /productos
- [ ] Verificar: grid de productos con fotos, precios, categorías
- [ ] Verificar: productos agotados muestran "Agotado" y botón deshabilitado
- [ ] Verificar: productos con stock<=3 muestran "Últimas unidades"
- [ ] Verificar: barra de búsqueda funciona
- [ ] Verificar: filtro por categoría funciona

### 2.2 ProductDetail (ej: /producto/1 — Lomo de Res Premium)
- [ ] Ir a /producto/1
- [ ] Verificar: galería grande a la izquierda con thumbnails
- [ ] Click en imagen principal → lightbox fullscreen se abre
- [ ] En lightbox: flechas ← → funcionan, Esc cierra, zoom al click
- [ ] Verificar: panel derecho con precio, cantidad +/-, observaciones, "Agregar al carrito"
- [ ] Verificar: sección "Ideal para" con iconos 3D isométricos de cocción (SVG de /media/iconos/usos/)
- [ ] Verificar: sección "Bondades y beneficios"
- [ ] Verificar: badges Refrigerado/Disponible
- [ ] **Visual:** iconos de cocción no deben ser emojis planos sino 3D coloridos

### 2.3 Agregar al carrito
- [ ] Click "Agregar al carrito" en un producto disponible
- [ ] Verificar: counter del carrito (header) aumenta
- [ ] Ir a /carrito
- [ ] Verificar: item aparece con foto, nombre, precio, cantidad, botones +/-

---

## BLOQUE 3: Carrito y checkout

### 3.1 Carrito como invitado (no logueado)
- [ ] Con item en carrito, ir a /carrito SIN estar logueado
- [ ] Verificar: banner verde "Regístrate y obtén 10% en tu primera compra" con links "Crear cuenta" / "Iniciar sesión"
- [ ] Verificar: resumen muestra Subtotal, Domicilio (por calcular), Total
- [ ] Verificar: formulario contacto pide Nombre y Teléfono/WhatsApp
- [ ] Verificar: método entrega Domicilio / Recoger en tienda
- [ ] Verificar: método pago "Pagar con PSE/Nequi" (Bold) y "WhatsApp"
- [ ] **Visual:** nada dice "cash" o "contra entrega"

### 3.2 Carrito como usuario nuevo (descuento 10%)
- [ ] Registrar usuario nuevo: /registro → nombre, email, contraseña, teléfono
- [ ] Login con ese usuario
- [ ] Agregar producto al carrito → ir a /carrito
- [ ] Verificar: línea verde "Descuento primera compra 10% − $X" en el resumen
- [ ] Verificar: Total = Subtotal - descuento + domicilio
- [ ] **Crítico:** el descuento DEBE aparecer (fue bug fix de esta sesión)

### 3.3 Programa de fidelización en carrito
- [ ] Con usuario que tenga puntos > 0 (crear uno vía admin si necesario)
- [ ] Verificar: bloque ámbar "Tus puntos: X pts" con checkbox "Usar puntos"
- [ ] Al activar checkbox → descuento por puntos aparece en resumen
- [ ] Total se reduce correctamente
- [ ] (Si usuario no tiene puntos, el bloque NO aparece)

### 3.4 Checkout WhatsApp
- [ ] Llenar contacto (nombre + teléfono 10 dígitos)
- [ ] Seleccionar "Recoger en tienda"
- [ ] Seleccionar "WhatsApp"
- [ ] Click enviar pedido
- [ ] Verificar: se abre WhatsApp (wa.me) con mensaje formateado
- [ ] Verificar: redirige a /pedido/:reference con estado "Pedido recibido"
- [ ] **Crítico:** si falla la orden (stock insuficiente), NO debe abrir WhatsApp

### 3.5 Checkout Bold (si sandbox está configurado)
- [ ] Mismo flujo pero seleccionar "Pagar con PSE/Nequi"
- [ ] Verificar: widget Bold se abre como iframe/modal (no redirige afuera)
- [ ] Verificar: monto en Bold coincide con total (NO está ×100)
- [ ] Tarjeta test: 4111 1111 1111 1111, CVC cualquiera, vencimiento futura

---

## BLOQUE 4: Tracking de pedido

### 4.1 Tracking público (/pedido/:reference)
- [ ] Verificar estado "Pedido recibido" (pending) → ícono reloj ámbar
- [ ] Desde admin, cambiar a "processing" → verificar "En preparación" azul
- [ ] Cambiar a "shipped" → verificar "Pedido en camino" violeta con ícono camión
- [ ] Cambiar a "completed" → verificar "Pedido entregado" verde
- [ ] **Visual:** borde superior del card cambia de color según estado

---

## BLOQUE 5: Admin — Ventas (pedidos)

### 5.1 Panel de ventas /admin/pedidos
- [ ] Login como admin → ir a /admin/pedidos
- [ ] Verificar: tabla con columnas ID, Cliente, Total, Pago, Entrega, Fuente, Estado, Fecha, Acciones
- [ ] Verificar: select de estado incluye "En camino" (shipped)
- [ ] Verificar: botones CSV y Excel en la barra superior

### 5.2 Botones WhatsApp por estado
- [ ] Con un pedido en estado "processing", verificar ícono WhatsApp verde en acciones
- [ ] Click → se abre wa.me con mensaje "Tu pedido #X está confirmado y lo estamos preparando"
- [ ] Cambiar a "shipped" → click WhatsApp → mensaje "Tu pedido #X ya va en camino"
- [ ] Cambiar a "completed" → click WhatsApp → mensaje "Tu pedido #X fue entregado exitosamente"
- [ ] Click en ojo (ver detalle) → modal con botón grande "Notificar al cliente por WhatsApp"

### 5.3 Export Excel
- [ ] Click botón "Excel" → descarga archivo .xlsx
- [ ] Abrir archivo → verificar 15 columnas (#, Fecha, Cliente, Teléfono, Dirección, Productos, Subtotal, Descuento, Domicilio, Total, Método pago, Estado pago, Estado pedido, Referencia, Ciudad)

### 5.4 Filtros
- [ ] Abrir filtros → verificar dropdown Estado incluye "En camino"
- [ ] Filtrar por método de pago, estado, fechas → tabla filtra correctamente

---

## BLOQUE 6: Admin — Dashboard

### 6.1 KPIs /admin (dashboard)
- [ ] Ir a /admin
- [ ] Verificar fila 1: Ingresos brutos, Ingresos productos, Domicilios cobrados, Pedidos
- [ ] Verificar fila 2: Clientes nuevos, Clientes recurrentes, Ticket promedio, Comisiones Bold
- [ ] Verificar fila 3: Tasa completados, Puntos emitidos, Puntos canjeados, Clientes con puntos
- [ ] Verificar: botones de rango (Hoy, 7 días, 30 días, Este mes) + date pickers

### 6.2 Gráficas
- [ ] Verificar: línea "Ventas en el período"
- [ ] Verificar: pie "Por método de pago"
- [ ] Verificar: bar "Estado de pedidos" (incluye "En camino" en violeta)
- [ ] Verificar: "Bajo stock" con lista de productos
- [ ] Verificar: "Top productos del período"
- [ ] Verificar: bar "Ventas por hora"
- [ ] Verificar: bar "Ventas por día de la semana"

---

## BLOQUE 7: Admin — Configuración

### 7.1 Descuento primera compra /admin/configuracion
- [ ] Ir a /admin/configuracion
- [ ] Verificar sección "Descuento primera compra" con toggle activo/inactivo + input %
- [ ] Toggle off → guardar → verificar que en carrito de usuario nuevo NO aparece descuento
- [ ] Toggle on → guardar → verificar que reaparece

### 7.2 Programa de fidelización
- [ ] Verificar sección "Programa de fidelización" con toggle + "Puntos por cada $1.000" + "Valor del punto ($)"
- [ ] Cambiar valores → guardar → verificar que se persisten (recargar página)

### 7.3 Popup de bienvenida
- [ ] Verificar sección "Pop-up de bienvenida" con toggle + modo genérico/producto
- [ ] Verificar campos: título, subtítulo, imagen, CTA label, CTA link
- [ ] Verificar modo "producto": selector de producto

---

## BLOQUE 8: Admin — Clientes

### 8.1 Lista /admin/clientes
- [ ] Ir a /admin/clientes
- [ ] Verificar columnas: Cliente, Contacto, Pedidos, Gastado, 1ª Compra, **Puntos**, Último pedido, Acciones
- [ ] Verificar: columna Puntos muestra 0 (o N si tiene) con color ámbar si > 0
- [ ] Verificar: badge "Disponible" (verde) o "Usada" (gris) en 1ª Compra
- [ ] Click en cliente → modal detalle con historial de pedidos

---

## BLOQUE 9: Páginas institucionales

### 9.1 Verificación rápida
- [ ] /nosotros → misión, visión, valores con animaciones
- [ ] /equipo → grid de tarjetas del equipo
- [ ] /ubicacion → mapa Google embed + datos de contacto
- [ ] /ayuda → FAQ acordeón (10 preguntas)
- [ ] /pqrs → formulario funcional (4 tipos)
- [ ] /recetas → grid de recetas

---

## BLOQUE 10: Regresiones a vigilar

- [ ] Header: admin ve "Panel Admin" (no "Mi cuenta"), customer ve avatar + nombre
- [ ] Productos por peso: fuerzan WhatsApp como pago, no muestran Bold
- [ ] WhatsApp flotante: visible en público, OCULTO en /admin/*
- [ ] Login admin redirige a /admin, customer redirige a /
- [ ] Mobile: menú hamburguesa funciona, carrito responsive
