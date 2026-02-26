const express = require('express')
const router  = express.Router()
const pool    = require('../db')

// GET todos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(l.id) as total_licencias,
        MAX(l.hasta) as ultima_hasta
      FROM clientes c
      LEFT JOIN licencias l ON l.cliente_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET uno
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST crear
router.post('/', async (req, res) => {
  const { nombre, peluqueria, whatsapp, email, notas } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' })
  try {
    const { rows } = await pool.query(`
      INSERT INTO clientes (nombre, peluqueria, whatsapp, email, notas)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [nombre.trim(), peluqueria || '', whatsapp || '', email || '', notas || ''])
    res.json({ id: rows[0].id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT editar
router.put('/:id', async (req, res) => {
  const { nombre, peluqueria, whatsapp, email, notas } = req.body
  try {
    await pool.query(`
      UPDATE clientes SET nombre=$1, peluqueria=$2, whatsapp=$3, email=$4, notas=$5
      WHERE id=$6
    `, [nombre, peluqueria, whatsapp, email, notas, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM licencias WHERE cliente_id = $1', [req.params.id])
    await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
