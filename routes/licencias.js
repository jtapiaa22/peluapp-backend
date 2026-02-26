const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../db')
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
router.get('/cliente/:clienteId', (req, res) => {
  const licencias = db.prepare(`
    SELECT * FROM licencias
    WHERE cliente_id = ?
    ORDER BY created_at DESC
  `).all(req.params.clienteId)
  res.json(licencias)
})

// POST generar licencia
router.post('/', (req, res) => {
  const { cliente_id, desde, hasta } = req.body
  if (!cliente_id || !desde || !hasta)
    return res.status(400).json({ error: 'Faltan datos' })
  if (desde > hasta)
    return res.status(400).json({ error: 'La fecha de inicio no puede ser mayor al vencimiento' })

  const licencia_b64 = generarLic(desde, hasta)
  const result = db.prepare(`
    INSERT INTO licencias (cliente_id, desde, hasta, licencia_b64)
    VALUES (?, ?, ?, ?)
  `).run(cliente_id, desde, hasta, licencia_b64)

  res.json({ id: result.lastInsertRowid, licencia_b64 })
})

// DELETE
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM licencias WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// GET descarga directa del .lic por URL
router.get('/:id/download', (req, res) => {
  const licencia = db.prepare('SELECT * FROM licencias WHERE id = ?').get(req.params.id)
  if (!licencia) return res.status(404).json({ error: 'Licencia no encontrada' })

  res.setHeader('Content-Disposition', `attachment; filename="licencia-${licencia.desde}-al-${licencia.hasta}.lic"`)
  res.setHeader('Content-Type', 'text/plain')
  res.send(licencia.licencia_b64)
})


module.exports = router
