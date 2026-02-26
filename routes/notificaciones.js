const express    = require('express')
const router     = express.Router()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

router.post('/email', async (req, res) => {
  const { id, nombre, peluqueria, email, desde, hasta, licencia_b64 } = req.body

  if (!email) return res.status(400).json({ error: 'El cliente no tiene email registrado' })

  try {
    await transporter.sendMail({
      from:    `"PeluApp" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: `Tu licencia de PeluApp — válida hasta ${hasta}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #7c3aed;">🔑 Tu licencia de PeluApp</h2>
          <p>Hola <strong>${nombre}</strong>${peluqueria ? ` de <strong>${peluqueria}</strong>` : ''}!</p>
          <p>Tu licencia está lista. Es válida desde <strong>${desde}</strong> hasta <strong>${hasta}</strong>.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${process.env.BACKEND_URL}/api/licencias/${id}/download"
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
        </div>
      `,
      attachments: [{
        filename:    `licencia-${desde}-al-${hasta}.lic`,
        content:     licencia_b64,
        contentType: 'text/plain'
      }]
    })

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al enviar el email' })
  }
})

module.exports = router
