require('dotenv').config()
const express              = require('express')
const cors                 = require('cors')
const clientesRouter       = require('./routes/clientes')
const licenciasRouter      = require('./routes/licencias')
const notificacionesRouter = require('./routes/notificaciones')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://peluapp-frontend.vercel.app'
  ]
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PeluApp backend corriendo 🚀' })
})

app.use('/api/clientes',       clientesRouter)
app.use('/api/licencias',      licenciasRouter)
app.use('/api/notificaciones', notificacionesRouter)

app.get('/api/stats', async (req, res) => {
  const pool = require('./db')
  const hoy  = new Date().toISOString().split('T')[0]
  const en30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const [totalClientes, activas, porVencer, vencidas, proximosVencer] = await Promise.all([
      pool.query('SELECT COUNT(*) as n FROM clientes'),
      pool.query('SELECT COUNT(*) as n FROM licencias WHERE hasta >= $1', [hoy]),
      pool.query('SELECT COUNT(*) as n FROM licencias WHERE hasta >= $1 AND hasta <= $2', [hoy, en30]),
      pool.query('SELECT COUNT(*) as n FROM licencias WHERE hasta < $1', [hoy]),
      pool.query(`
        SELECT c.nombre, c.peluqueria, c.whatsapp, l.hasta
        FROM licencias l
        JOIN clientes c ON c.id = l.cliente_id
        WHERE l.hasta >= $1 AND l.hasta <= $2
        ORDER BY l.hasta ASC
      `, [hoy, en30])
    ])

    res.json({
      totalClientes:  parseInt(totalClientes.rows[0].n),
      activas:        parseInt(activas.rows[0].n),
      porVencer:      parseInt(porVencer.rows[0].n),
      vencidas:       parseInt(vencidas.rows[0].n),
      proximosVencer: proximosVencer.rows
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => console.log(`🚀 Backend corriendo en http://localhost:${PORT}`))
