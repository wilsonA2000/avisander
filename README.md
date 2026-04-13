# Avisander

Landing page y e-commerce para Avisander, una carniceria premium ubicada en Bucaramanga, Colombia.

## Descripcion

Avisander es una aplicacion web que permite a los clientes:
- Explorar el catalogo de productos (carnes de res, cerdo, pollo, huevos, lacteos)
- Agregar productos al carrito de compras
- Enviar pedidos directamente a WhatsApp para coordinar pago y entrega

## Tecnologias

### Frontend
- React 18 con Vite
- Tailwind CSS
- React Router v6
- Lucide React (iconos)

### Backend
- Node.js con Express
- SQLite con better-sqlite3
- JWT para autenticacion
- Multer para upload de imagenes

## Requisitos

- Node.js 18 o superior
- npm o yarn

## Instalacion y Ejecucion

### Opcion 1: Script automatico

```bash
./init.sh
```

### Opcion 2: Manual

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Iniciar backend (en una terminal)
cd backend
npm run dev

# Iniciar frontend (en otra terminal)
cd frontend
npm run dev
```

## URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api

## Estructura del Proyecto

```
avisander/
├── frontend/           # Aplicacion React
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── pages/      # Paginas de la aplicacion
│   │   ├── context/    # React Context (auth, cart)
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # Utilidades
│   └── ...
├── backend/            # API Express
│   ├── routes/         # Rutas de la API
│   ├── middleware/     # Middleware (auth, etc)
│   ├── db/             # Configuracion SQLite
│   └── uploads/        # Imagenes subidas
├── init.sh             # Script de configuracion
└── README.md
```

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| Visitante | Ver productos, agregar al carrito, enviar pedido a WhatsApp |
| Cliente | Todo lo de visitante + cuenta, historial, favoritos |
| Admin | Gestion completa de productos, categorias, pedidos y configuracion |

## API Endpoints

### Autenticacion
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesion
- `POST /api/auth/logout` - Cerrar sesion
- `GET /api/auth/me` - Usuario actual

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Detalle de producto
- `GET /api/products/featured` - Productos destacados
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Editar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Crear categoria (admin)
- `PUT /api/categories/:id` - Editar categoria (admin)
- `DELETE /api/categories/:id` - Eliminar categoria (admin)

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Crear pedido
- `PUT /api/orders/:id/status` - Actualizar estado (admin)

### Configuracion
- `GET /api/settings` - Obtener configuracion
- `PUT /api/settings` - Actualizar configuracion (admin)

## Informacion del Negocio

- **Nombre:** Avisander
- **Direccion:** Cra 23 #20-70 Local 2, Bucaramanga
- **Telefono:** 3162530287
- **WhatsApp:** 3162530287

## Licencia

Proyecto privado - Todos los derechos reservados.
