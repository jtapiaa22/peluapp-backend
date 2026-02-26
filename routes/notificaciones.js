const express      = require('express')
const router       = express.Router()
const nodemailer   = require('nodemailer')
const db           = require('../db')


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})


// POST /api/notificaciones/email
router.post('/email', async (req, res) => {
  const { licencia_id } = req.body

  const licencia = db.prepare(`
    SELECT l.*, c.nombre, c.peluqueria, c.email
    FROM licencias l
    JOIN clientes c ON c.id = l.cliente_id
    WHERE l.id = ?
  `).get(licencia_id)

  if (!licencia) return res.status(404).json({ error: 'Licencia no encontrada' })
  if (!licencia.email) return res.status(400).json({ error: 'El cliente no tiene email registrado' })

  try {
        await transporter.sendMail({
    from:    `"PeluApp" <${process.env.GMAIL_USER}>`,
    to:      licencia.email,
    subject: `Tu licencia de PeluApp — válida hasta ${licencia.hasta}`,
    html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #7c3aed;">🔑 Tu licencia de PeluApp</h2>
        <p>Hola <strong>${licencia.nombre}</strong>${licencia.peluqueria ? ` de <strong>${licencia.peluqueria}</strong>` : ''}!</p>
        <p>Tu licencia está lista. Es válida desde <strong>${licencia.desde}</strong> hasta <strong>${licencia.hasta}</strong>.</p>
        <div style="margin: 24px 0; text-align: center;">
            <a href="${process.env.BACKEND_URL}/api/licencias/${licencia.id}/download"
            style="background: #7c3aed; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            📥 Descargar licencia
            </a>
        </div>
        <p style="color: #555; font-size: 13px;">
            <strong>Instrucciones:</strong><br/>
            1. Hacé click en el botón para descargar el archivo<br/>
            2. Abrí PeluApp<br/>
            3. En la pantalla de activación, cargá el archivo
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
            El archivo también va adjunto a este correo por si el link no funciona.
        </p>
        </div>
    `,
    attachments: [
        {
        filename:    `licencia-${licencia.desde}-al-${licencia.hasta}.lic`,
        content:     licencia.licencia_b64,
        contentType: 'text/plain'
        }
    ]
    })

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al enviar el email' })
  }
})

module.exports = router
