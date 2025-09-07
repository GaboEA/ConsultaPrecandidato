// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://www.encuestapactohistorico.com',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

//2. conectar con BD
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 4. Endpoint POST /vote
app.post('/vote', async (req, res) => {
  const { candidateId, recaptchaToken } = req.body;
  const ip = req.ip.replace(/::ffff:/, '');
  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1. Verificar token con Google
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
    const googleRes = await fetch(verifyURL, { method: 'POST' });
    const data = await googleRes.json();

    if (!data.success) {
      return res.status(400).json({ success: false, message: 'Fallo en verificación reCAPTCHA' });
    }

    // 2. Insertar el voto si el reCAPTCHA es válido
    const query = `
      INSERT INTO votes (id_precandidato, ip_usuario, fecha_apoyo)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [candidateId, ip, today]);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al guardar voto' });
  }
});

// 5. Endpoint GET /results?period=weekly&week=1
app.get('/results', async (req, res) => {
  const { period } = req.query;
  let dateFilter = '';

  if (period === 'weekly') {
    dateFilter = `EXTRACT(WEEK FROM fecha_apoyo::DATE) = EXTRACT(WEEK FROM CURRENT_DATE)`;
  } else if (period === 'monthly') {
    dateFilter = `TO_CHAR(fecha_apoyo::DATE, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`;
  } else {
    dateFilter = 'TRUE';
  }

  const query = `
    SELECT id_precandidato AS id, COUNT(*) AS votos
    FROM votes
    WHERE ${dateFilter}
    GROUP BY id_precandidato
    ORDER BY id_precandidato
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

  try {
    const result = await pool.query(query);
    const labels = result.rows.map(r => candidateNames[r.id] || `Persona ${r.id}`);
    const votes = result.rows.map(r => r.votos);
    const totalVotos = result.rows.reduce((sum, r) => sum + parseInt(r.votos), 0);

    res.json({ labels, votes, total: totalVotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error BD resultados' });
  }

});

app.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM votes ORDER BY fecha_apoyo DESC');
    const rows = result.rows;

    const header = Object.keys(rows[0]).join(',');
    const csv = rows.map(r => Object.values(r).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.send(`${header}\n${csv}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al exportar datos');
  }
});

// 6. Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));