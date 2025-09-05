// server.js
const express   = require('express');
const sqlite3   = require('sqlite3').verbose();
const path      = require('path');
const cors      = require('cors');

// 1. Configuración de Express
const app = express();
app.use(express.json());
app.use(cors());           // si frontend corre en otro origen

// 2. Conectar / crear base de datos SQLite
const dbPath = path.resolve(__dirname, 'votes.db');
const db     = new sqlite3.Database(dbPath, err => {
  if (err) console.error('Error al abrir BD:', err);
  else console.log('Conectado a votes.db');
});

// 3. Crear tabla de votos si no existe
const createTableSQL = `
CREATE TABLE IF NOT EXISTS votes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id  INTEGER NOT NULL,
  ip            TEXT    NOT NULL,
  vote_date     TEXT    NOT NULL
);
`;
db.run(createTableSQL);

// 4. Endpoint POST /vote
app.post('/vote', (req, res) => {
  const candidateId = req.body.candidateId;
  const ip           = req.ip.replace(/::ffff:/, '');   // atenúa IPv4 en proxy
  const today        = new Date().toISOString().slice(0,10);
  // Verificar si ya votó hoy
//   const checkSQL = `
//     SELECT COUNT(*) AS count 
//       FROM votes 
//      WHERE ip = ? AND vote_date = ?;
//   `;
//   db.get(checkSQL, [ip, today], (err, row) => {
//     if (err) return res.status(500).json({ success: false, message: 'Error BD' });

//     if (row.count > 0) {
//       return res.json({ success: false, message: 'Ya votaste hoy.' });
//     }

    // Insertar el voto
    const insertSQL = `
      INSERT INTO votes (candidate_id, ip, vote_date)
      VALUES (?, ?, ?);
    `;
    db.run(insertSQL, [candidateId, ip, today], err2 => {
      if (err2) return res.status(500).json({ success: false, message: 'Error al guardar voto' });
      res.json({ success: true });
    });
  });
// });

// 5. Endpoint GET /results?period=weekly&week=1
app.get('/results', (req, res) => {
  const { period } = req.query;

  // Filtrar fecha según período
  let dateFilter = '';
    if (period === 'weekly') {
        dateFilter = `strftime('%Y', vote_date) = strftime('%Y','now')
        AND strftime('%W', vote_date) = strftime('%W','now')`;
    } else if (period === 'monthly') {
        dateFilter = `strftime('%Y-%m', vote_date) = strftime('%Y-%m','now')`;
    } else {
        dateFilter = '1=1';  // global
    }

  const sql = `
    SELECT candidate_id AS id, COUNT(*) AS votes
      FROM votes
     WHERE ${dateFilter}
  GROUP BY candidate_id
  ORDER BY candidate_id;
  `;

  const candidateNames = {
    1: 'Alí Bantú Ashanti',
    2: 'Gustavo Bolívar',
    3: 'Iván Cepeda',
    4: 'Carolina Corcho',
    5: 'Gloria Flórez',
    6: 'Susana Muhamad',
    7: 'María José Pizarro',
    8: 'Daniel Quintero',
    9: 'Camilo Romero'
};

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error BD resultados' });

    // Transformar en arrays de labels y votos
    const labels = rows.map(r => candidateNames[r.id] || `Persona ${r.id}`);
    const votes  = rows.map(r => r.votes);
    // rows.forEach(r => {
    //   labels.push(`Persona ${r.id}`);
    //   votes.push(r.votes);
    // });

    res.json({ labels, votes });
  });
});

// 6. Arrancar servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
