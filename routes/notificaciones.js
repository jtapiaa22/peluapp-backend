const express = require('express')
const router  = express.Router()
const sgMail  = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

router.post('/email', async (req, res) => {
  const { id, nombre, peluqueria, email, desde, hasta, licencia_b64 } = req.body

  if (!email) return res.status(400).json({ error: 'El cliente no tiene email registrado' })

  try {
    await sgMail.send({
      to:      email,
      from:    process.env.GMAIL_USER,
      subject: `Tu licencia de PeluApp — válida hasta ${hasta}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #7c3aed;">🔑 Tu licencia de PeluApp</h2>
            <p>Hola <strong>${nombre}</strong>${peluqueria ? ` de <strong>${peluqueria}</strong>` : ''}!</p>
            <p>Tu licencia está lista. Es válida desde <strong>${desde}</strong> hasta <strong>${hasta}</strong>.</p>
            <p style="background: #ede9fe; padding: 16px; border-radius: 8px; color: #5b21b6;">
            📎 El archivo <strong>.lic</strong> va adjunto a este correo.
            </p>
            <p style="color: #555; font-size: 13px;">
            <strong>Instrucciones:</strong><br/>
            1. Descargá el archivo adjunto<br/>
            2. Abrí PeluApp<br/>
            3. En la pantalla de activación, cargá el archivo
            </p>
        </div>
        `,

      attachments: [{
        filename:    `licencia-${desde}-al-${hasta}.lic`,
        content:     Buffer.from(licencia_b64).toString('base64'),
        type:        'text/plain',
        disposition: 'attachment'
      }]
    })

    res.json({ ok: true })
  } catch (e) {
    console.error(e?.response?.body || e)
    res.status(500).json({ error: 'Error al enviar el email' })
  }
})

module.exports = router
