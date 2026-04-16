// Mapa central de iconos 3D de Avisander.
// Para cada slug devuelve:
//   - png: ruta relativa al PNG 3D clay (en /media/iconos/3d/...)
//   - fallback: componente lucide-react que se usa si el PNG no existe
//   - alias: nombres alternativos por los que también se puede referir
//
// Uso: <Icon3D name="shopping-cart" size="md" />
//
// Si un PNG no está disponible (404), el componente Icon3D renderiza el fallback
// lucide automáticamente — la UI nunca se rompe.

import {
  // UI actions
  ShoppingCart, User, Search, Heart, Menu, X, Check, AlertTriangle,
  XCircle, Info, Clock, Calendar, MapPin, Phone, Mail, HelpCircle,
  Shield, Star, ArrowRight, ArrowUp, Play, ZoomIn, Eye, Plus, Minus,
  // Cooking
  Flame, CookingPot, Utensils, ChefHat, Pizza, Droplets, Sparkles, Microwave,
  // Trust
  Leaf, Snowflake, Truck, MessageCircle, Award,
  // Categories
  Beef, Egg, Milk, Sandwich, Salad, Package, Cookie,
  // Extras
  ShieldCheck, CheckCircle2, Target, Users as UsersIcon, Home as HomeIcon,
  BookOpen, Camera, Save, Trash2, Pencil, Filter, ArrowLeft, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, Tag, Bookmark, RefreshCw, Loader2,
  Building2, Navigation, FileText, Lock, UserCheck, ShieldAlert, FileSearch
} from 'lucide-react'

const PNG_BASE = '/media/iconos/3d'

// Helper para crear entradas consistentes. Usa alias para que slugs relacionados
// apunten al mismo PNG sin duplicar archivos.
const icon = (png, fallback, alias = []) => ({ png: `${PNG_BASE}/${png}.png`, fallback, alias })

export const ICON_MAP = {
  // ============ CATEGORÍAS DE PRODUCTOS ============
  'res':           icon('res',           Beef,     ['beef', 'carne-res']),
  'cerdo':         icon('cerdo',         Beef,     ['pork', 'pig']),
  'pollo':         icon('pollo',         Beef,     ['chicken', 'poultry']),
  'huevos':        icon('huevos',        Egg,      ['egg', 'eggs']),
  'lacteos':       icon('lacteos',       Milk,     ['dairy', 'leche']),
  'carnes-frias':  icon('carnes-frias',  Sandwich, ['cold-cuts', 'jamon']),
  'embutidos':     icon('embutidos',     Sandwich, ['sausage', 'chorizo']),
  'congelado':     icon('congelado',     Snowflake,['frozen']),
  'fruver':        icon('fruver',        Salad,    ['fruits-vegetables', 'produce']),
  'varios':        icon('varios',        Package,  ['misc', 'other']),

  // ============ USOS CULINARIOS ============
  'asar':          icon('asar',          Flame,    ['roast']),
  'parrilla':      icon('parrilla',      Flame,    ['grill', 'bbq']),
  'freir':         icon('freir',         CookingPot, ['fry', 'frying']),
  'sofreir':       icon('sofreir',       Utensils, ['saute', 'stir-fry']),
  'hornear':       icon('hornear',       Pizza,    ['bake', 'oven']),
  'estofar':       icon('estofar',       CookingPot, ['stew']),
  'guisar':        icon('guisar',        CookingPot, ['braise']),
  'sudar':         icon('sudar',         Droplets, ['steam']),
  'ahumar':        icon('ahumar',        Sparkles, ['smoke']),
  'cocinar':       icon('cocinar',       ChefHat,  ['cook']),
  'microondas':    icon('microondas',    Microwave,['microwave']),

  // ============ TRUST SIGNALS + FEATURES ============
  'fresh':         icon('fresh',         Leaf,     ['freshness', 'hoja']),
  'cold-chain':    icon('cold-chain',    Snowflake,['frio', 'refrigerado']),
  'delivery':      icon('delivery',      Truck,    ['truck', 'envio']),
  'whatsapp-chat': icon('whatsapp-chat', MessageCircle, ['chat', 'whatsapp']),
  'quality-medal': icon('quality-medal', Award,    ['medal', 'quality', 'trofeo']),

  // ============ UI ACCIONES — HIGH IMPACT ============
  'shopping-cart': icon('shopping-cart', ShoppingCart, ['cart', 'carrito']),
  'user':          icon('user',          User,     ['profile', 'account']),
  'search':        icon('search',        Search,   ['lupa', 'buscar']),
  'heart':         icon('heart',         Heart,    ['favorite', 'like']),
  'menu':          icon('menu',          Menu,     ['hamburger']),
  'close':         icon('close',         X,        ['x', 'cerrar']),
  'check':         icon('check',         Check,    ['checkmark']),
  'alert':         icon('alert',         AlertTriangle, ['warning']),
  'error':         icon('error',         XCircle,  ['x-circle']),
  'info':          icon('info',          Info,     ['information']),
  'clock':         icon('clock',         Clock,    ['tiempo']),
  'calendar':      icon('calendar',      Calendar, ['date']),
  'map-pin':       icon('map-pin',       MapPin,   ['location', 'ubicacion']),
  'phone':         icon('phone',         Phone,    ['telefono']),
  'mail':          icon('mail',          Mail,     ['email']),
  'help':          icon('help',          HelpCircle, ['ayuda', 'question']),
  'shield':        icon('shield',        Shield,   ['security']),
  'star':          icon('star',          Star,     ['rating']),
  'arrow-right':   icon('arrow-right',   ArrowRight, ['next']),
  'arrow-up':      icon('arrow-up',      ArrowUp,  ['up', 'scroll-top']),
  'play':          icon('play',          Play,     ['video']),
  'zoom-in':       icon('zoom-in',       ZoomIn,   ['zoom', 'magnify']),
  'eye':           icon('eye',           Eye,      ['view', 'ver']),
  'plus':          icon('plus',          Plus,     ['add']),
  'minus':         icon('minus',         Minus,    ['remove']),

  // ============ EXTRAS UTILES (fallback a lucide si no hay PNG) ============
  'checkbox':      icon('check',         CheckCircle2, ['success']),
  'target':        icon('target',        Target,   ['objetivo']),
  'users':         icon('users',         UsersIcon, ['people', 'team']),
  'home':          icon('home',          HomeIcon, ['casa']),
  'book':          icon('book',          BookOpen, ['recipe', 'receta']),
  'camera':        icon('camera',        Camera,   ['photo']),
  'save':          icon('save',          Save,     ['disk']),
  'trash':         icon('trash',         Trash2,   ['delete']),
  'pencil':        icon('pencil',        Pencil,   ['edit']),
  'filter':        icon('filter',        Filter,   ['filtros']),
  'arrow-left':    icon('arrow-left',    ArrowLeft, ['back']),
  'chevron-left':  icon('chevron-left',  ChevronLeft, ['prev']),
  'chevron-right': icon('chevron-right', ChevronRight, ['next-small']),
  'chevron-down':  icon('chevron-down',  ChevronDown, ['expand']),
  'chevron-up':    icon('chevron-up',    ChevronUp, ['collapse']),
  'tag':           icon('tag',           Tag,      ['price']),
  'bookmark':      icon('bookmark',      Bookmark),
  'refresh':       icon('refresh',       RefreshCw, ['reload']),
  'loader':        icon('loader',        Loader2,  ['spinner', 'loading']),
  'building':      icon('building',      Building2, ['store', 'tienda']),
  'navigation':    icon('navigation',    Navigation, ['gps']),
  'file':          icon('file',          FileText, ['document']),
  'lock':          icon('lock',          Lock,     ['padlock']),
  'shield-check':  icon('shield-check',  ShieldCheck, ['verified']),
  'shield-alert':  icon('shield-alert',  ShieldAlert, ['sarlaft']),
  'file-search':   icon('file-search',   FileSearch),
  'user-check':    icon('user-check',    UserCheck),
  'package':       icon('varios',        Package,  ['box']),
  'leaf':          icon('fresh',         Leaf),
  'snowflake':     icon('cold-chain',    Snowflake),
  'truck':         icon('delivery',      Truck),
  'chat':          icon('whatsapp-chat', MessageCircle),
  'medal':         icon('quality-medal', Award),
  'fire':          icon('asar',          Flame),
}

// Resolución por alias: permite usar cualquier nombre alias y retornar la entrada principal.
export function resolveIcon(name) {
  if (!name) return null
  const lower = String(name).toLowerCase().trim()
  if (ICON_MAP[lower]) return ICON_MAP[lower]
  // Buscar en aliases
  for (const [key, entry] of Object.entries(ICON_MAP)) {
    if (entry.alias?.includes(lower)) return ICON_MAP[key]
  }
  return null
}

// Tamaños estándar (en px) — alinea con escala de diseño.
export const ICON_SIZES = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 112
}

// Lottie animations mapa — se usan en LottieIcon. Si el archivo no existe (404),
// el componente cae a Icon3D automático con el slug equivalente.
export const LOTTIE_MAP = {
  'loading':        '/media/lotties/loading.json',
  'success':        '/media/lotties/success.json',
  'error':          '/media/lotties/error.json',
  'empty-cart':     '/media/lotties/empty-cart.json',
  'delivery-truck': '/media/lotties/delivery-truck.json',
  'fire-cooking':   '/media/lotties/fire-cooking.json',
  'whatsapp':       '/media/lotties/whatsapp.json',
  'scale-weight':   '/media/lotties/scale-weight.json',
  'fridge':         '/media/lotties/fridge.json',
  'steam':          '/media/lotties/steam.json',
  'hero-meat':      '/media/lotties/hero-meat.json',
  'onboarding':     '/media/lotties/onboarding.json'
}
