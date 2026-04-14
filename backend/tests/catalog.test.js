import crypto from 'node:crypto'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

const { db, initialize } = require('../db/database')
const { createApp } = require('../app')

describe('Catálogo (Sprint 3)', () => {
  let app

  beforeAll(() => {
    initialize()
    app = createApp({ enableRateLimit: false })
  })

  it('listado con paginación devuelve {items,total,page,per_page}', async () => {
    const res = await request(app).get('/api/products?page=1&per_page=5')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(res.body.per_page).toBe(5)
    expect(res.body.items.length).toBeLessThanOrEqual(5)
  })

  it('listado sin paginación sigue devolviendo array (retrocompat)', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('búsqueda q filtra por search_text', async () => {
    const res = await request(app).get('/api/products?q=pollo&page=1&per_page=50')
    expect(res.status).toBe(200)
    expect(res.body.items.length).toBeGreaterThan(0)
    // Todo resultado debe contener "pollo" en algún campo conocido (name/category/brand)
    const allMatch = res.body.items.every((p) => {
      const haystack = `${p.name} ${p.category_name || ''} ${p.brand || ''} ${p.subcategory || ''}`.toLowerCase()
      return haystack.includes('pollo')
    })
    expect(allMatch).toBe(true)
  })

  it('per_page se respeta con tope 60', async () => {
    const res = await request(app).get('/api/products?page=1&per_page=999')
    expect(res.status).toBe(200)
    expect(res.body.per_page).toBe(60)
    expect(res.body.items.length).toBeLessThanOrEqual(60)
  })

  it('facets devuelve categorías, subcategorías, brands y rango de precio', async () => {
    const res = await request(app).get('/api/products/facets')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('categories')
    expect(res.body).toHaveProperty('subcategories')
    expect(res.body).toHaveProperty('brands')
    expect(res.body).toHaveProperty('price_range')
  })

  it('suggestions devuelve máximo 8 con q de 2+ chars', async () => {
    const res = await request(app).get('/api/products/suggestions?q=ch')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeLessThanOrEqual(8)
  })

  it('related excluye el producto actual', async () => {
    const any = db.prepare('SELECT id FROM products LIMIT 1').get()
    if (!any) return
    const res = await request(app).get(`/api/products/${any.id}/related?limit=5`)
    expect(res.status).toBe(200)
    expect(res.body.every((p) => p.id !== any.id)).toBe(true)
  })

  it('recetas: CRUD admin + listado público solo publicadas', async () => {
    // Login admin
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@avisander.com', password: 'admin123' })
    expect(login.status).toBe(200)
    const token = login.body.token

    // Crear receta no publicada
    const created = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test receta', is_published: false })
    expect(created.status).toBe(201)
    const slug = created.body.slug

    // Listado público no la devuelve
    const publicList = await request(app).get('/api/recipes')
    expect(publicList.body.some((r) => r.slug === slug)).toBe(false)

    // Publicar
    const updated = await request(app)
      .put(`/api/recipes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_published: true })
    expect(updated.status).toBe(200)

    // Ahora sí aparece
    const publicList2 = await request(app).get('/api/recipes')
    expect(publicList2.body.some((r) => r.slug === slug)).toBe(true)

    // Limpieza
    await request(app).delete(`/api/recipes/${created.body.id}`).set('Authorization', `Bearer ${token}`)
  })
})
