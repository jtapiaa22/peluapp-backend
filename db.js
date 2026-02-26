const Database = require('better-sqlite3')
const path     = require('path')

const db = new Database(path.join(__dirname, 'licencias.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL,
    peluqueria   TEXT,
    whatsapp     TEXT,
    email        TEXT,
    notas        TEXT,
    created_at   TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS licencias (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id   INTEGER NOT NULL,
    desde        TEXT NOT NULL,
    hasta        TEXT NOT NULL,
    licencia_b64 TEXT NOT NULL,
    created_at   TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );
`)

module.exports = db
