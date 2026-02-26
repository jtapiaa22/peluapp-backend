require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const clientesRouter       = require('./routes/clientes')
const licenciasRouter      = require('./routes/licencias')
const notificacionesRouter = require('./routes/notificaciones')

const app  = express()
const PORT = process.env.PORT || 3001

// ⚠️ CORS y JSON primero, antes de todo
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://peluapp-frontend.vercel.app'  // ← tu URL de Vercel
  ]
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PeluApp backend corriendo 🚀' })
})

app.use('/api/clientes',       clientesRouter)
app.use('/api/licencias',      licenciasRouter)
app.use('/api/notificaciones', notificacionesRouter)

app.get('/api/stats', (req, res) => {
  const db   = require('./db')
  const hoy  = new Date().toISOString().split('T')[0]
  const en30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const totalClientes  = db.prepare('SELECT COUNT(*) as n FROM clientes').get().n
  const activas        = db.prepare("SELECT COUNT(*) as n FROM licencias WHERE hasta >= ?").get(hoy).n
  const porVencer      = db.prepare("SELECT COUNT(*) as n FROM licencias WHERE hasta >= ? AND hasta <= ?").get(hoy, en30).n
  const vencidas       = db.prepare("SELECT COUNT(*) as n FROM licencias WHERE hasta < ?").get(hoy).n
  const proximosVencer = db.prepare(`
    SELECT c.nombre, c.peluqueria, c.whatsapp, l.hasta
    FROM licencias l
    JOIN clientes c ON c.id = l.cliente_id
    WHERE l.hasta >= ? AND l.hasta <= ?
    ORDER BY l.hasta ASC
  `).all(hoy, en30)

  res.json({ totalClientes, activas, porVencer, vencidas, proximosVencer })
})

app.listen(PORT, () => console.log(`🚀 Backend corriendo en http://localhost:${PORT}`))
