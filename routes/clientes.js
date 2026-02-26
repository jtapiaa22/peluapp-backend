const express = require('express')
const router  = express.Router()
const db      = require('../db')

// GET todos
router.get('/', (req, res) => {
  const clientes = db.prepare(`
    SELECT c.*,
      COUNT(l.id) as total_licencias,
      MAX(l.hasta) as ultima_hasta
    FROM clientes c
    LEFT JOIN licencias l ON l.cliente_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all()
  res.json(clientes)
})

// GET uno
router.get('/:id', (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })
  res.json(cliente)
})

// POST crear
router.post('/', (req, res) => {
  const { nombre, peluqueria, whatsapp, email, notas } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' })
  const result = db.prepare(`
    INSERT INTO clientes (nombre, peluqueria, whatsapp, email, notas)
    VALUES (?, ?, ?, ?, ?)
  `).run(nombre.trim(), peluqueria || '', whatsapp || '', email || '', notas || '')
  res.json({ id: result.lastInsertRowid })
})

// PUT editar
router.put('/:id', (req, res) => {
  const { nombre, peluqueria, whatsapp, email, notas } = req.body
  db.prepare(`
    UPDATE clientes SET nombre=?, peluqueria=?, whatsapp=?, email=?, notas=?
    WHERE id=?
  `).run(nombre, peluqueria, whatsapp, email, notas, req.params.id)
  res.json({ ok: true })
})

// DELETE
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM licencias WHERE cliente_id = ?').run(req.params.id)
  db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
