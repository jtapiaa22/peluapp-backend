const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const pool    = require('../db')
require('dotenv').config()

const SECRET_KEY = process.env.SECRET_KEY

function generarLic(desde, hasta) {
  const firma = crypto.createHmac('sha256', SECRET_KEY)
    .update(`peluapp|${desde}|${hasta}`)
    .digest('hex')
  const datos = { app: 'peluapp', desde, vence: hasta, firma }
  return Buffer.from(JSON.stringify(datos)).toString('base64')
}

// GET todas las licencias de un cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM licencias
      WHERE cliente_id = $1
      ORDER BY created_at DESC
    `, [req.params.clienteId])
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST generar licencia
router.post('/', async (req, res) => {
  const { cliente_id, desde, hasta } = req.body
  if (!cliente_id || !desde || !hasta)
    return res.status(400).json({ error: 'Faltan datos' })
  if (desde > hasta)
    return res.status(400).json({ error: 'La fecha de inicio no puede ser mayor al vencimiento' })
  try {
    const licencia_b64 = generarLic(desde, hasta)
    const { rows } = await pool.query(`
      INSERT INTO licencias (cliente_id, desde, hasta, licencia_b64)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [cliente_id, desde, hasta, licencia_b64])
    res.json({ id: rows[0].id, licencia_b64 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM licencias WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET descarga directa del .lic
router.get('/:id/download', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM licencias WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Licencia no encontrada' })
    const licencia = rows[0]
    res.setHeader('Content-Disposition', `attachment; filename="licencia-${licencia.desde}-al-${licencia.hasta}.lic"`)
    res.setHeader('Content-Type', 'text/plain')
    res.send(licencia.licencia_b64)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
