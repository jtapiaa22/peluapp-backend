const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id           SERIAL PRIMARY KEY,
      nombre       TEXT NOT NULL,
      peluqueria   TEXT,
      whatsapp     TEXT,
      email        TEXT,
      notas        TEXT,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS licencias (
      id           SERIAL PRIMARY KEY,
      cliente_id   INTEGER NOT NULL REFERENCES clientes(id),
      desde        TEXT NOT NULL,
      hasta        TEXT NOT NULL,
      licencia_b64 TEXT NOT NULL,
      created_at   TIMESTAMP DEFAULT NOW()
    );
  `)
}

init().catch(console.error)

module.exports = pool
