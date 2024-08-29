var express = require('express');
var router = express.Router();
var pg = require('pg');
var bcrypt = require('bcrypt');
const http = require('http').createServer(router);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

var config = {
  user: 'adiftemf',
  database: 'adiftemf',
  password: 'AkqVl1pGZmDX9vgpT3C0HaGWyAn3olfN',
  host: 'cornelius.db.elephantsql.com',
  port: 5432,
  max: 200,
  idleTimeoutMillis: 30000,
};

var pool = new pg.Pool(config);

router.get('/menadzer-profil/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const result = await client.query(
        'SELECT * FROM menadzer WHERE id_menadzer = $1',
        [id_menadzer]
    );

    if (result.rows.length === 0) {
      res.status(404).render('error', { error: 'Menadzer nije pronadjen' });
    } else {
      const menadzer = result.rows[0];
      res.render('menadzer/menadzer-profil', {
        title: 'Menadžer Profil',
        menadzer: menadzer,
      });
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
    // Handle the error (e.g., render an error page)
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

router.get('/ocjene/:id_menadzer', async (req, res, next) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const result = await client.query(
        `SELECT * FROM menadzer WHERE id_menadzer = $1`,
        [id_menadzer]
    );

    if (result.rows.length === 0) {
      res.status(404).render('error', { error: 'Menadzer nije pronadjen' });
    } else {
      const menadzer = result.rows[0];
      res.render('menadzer/ocjene', {
        title: 'Ocjenjivanje aplikacije',
        menadzer: menadzer,
      });
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

router.post('/ocjene/:id_menadzer', async (req, res) => {
  try {
    const client = await pool.connect();

    const {
      ime_menadzer,
      prezime_menadzer,
      username_menadzer,
      ocjena1,
      ocjena2,
      ocjena3,
      ocjena4,
      ocjena5,
      komentar,
    } = req.body;

    const insertQuery = `
      INSERT INTO ocjene (ime, prezime, username, dizajn, funkcionalnost, komunikacija, brzina, projekat, komentar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;

    const values = [
      ime_menadzer,
      prezime_menadzer,
      username_menadzer,
      ocjena1,
      ocjena2,
      ocjena3,
      ocjena4,
      ocjena5,
      komentar,
    ];

    await client.query(insertQuery, values);

    const id_menadzer = req.params.id_menadzer;

    res.redirect(`/menadzer/menadzer-profil/${id_menadzer}`);

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Greška prilikom spašavanja ocjena u bazu.');
  }
});

io.on('connection', (socket) => {
  console.log('Korisnik povezan putem socketa!');

  // Osluškivanje događaja kada korisnik pošalje poruku
  socket.on('sendMessage', async (data) => {
    const { username_primalac, poruka } = data;

    try {
      const client = await pool.connect();

      const insertQuery = `
        INSERT INTO poruke (username_posiljalac, username_primalac, poruka)
        VALUES ($1, $2, $3)
        RETURNING *;`;

      const values = [data.username_posiljalac, username_primalac, poruka];

      const insertedMessageInfo = await client.query(insertQuery, values);

      // Emitovanje događaja kako bi obavijestili klijenta
      io.to(socket.id).emit('newMessage', {
        username_posiljalac: data.username_posiljalac,
        username_primalac: data.username_primalac,
        poruka: data.poruka,
      });

      // Emitovanje događaja kako bi obavijestili primaoca
      io.to(username_primalac).emit('receivedMessage', {
        username_posiljalac: data.username_posiljalac,
        username_primalac: data.username_primalac,
        poruka: data.poruka,
      });

      client.release();
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/poruke/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const menadzerResult = await client.query(
        `SELECT * FROM menadzer WHERE id_menadzer = $1`,
        [id_menadzer]
    );

    const radniciResult = await client.query(
        'SELECT * FROM radnik'
    );

    const menadzeriResult = await client.query(
        'SELECT * FROM menadzer'
    );

    const administratoriResult = await client.query(
        'SELECT * FROM administrator'
    );

    const porukeResult = await client.query(
        `SELECT * FROM poruke WHERE username_primalac = $1 OR username_posiljalac = $1`,
        [menadzerResult.rows[0].username_menadzer]
    );

    const poruke = porukeResult.rows;
    const menadzer = menadzerResult.rows[0];
    const radnici = radniciResult.rows;
    const menadzeri = menadzeriResult.rows;
    const administratori = administratoriResult.rows;

    res.render('menadzer/poruke', {
      title: 'Poruke',
      menadzer: menadzer,
      poruke: poruke,
      radnici: radnici,
      menadzeri: menadzeri,
      administratori: administratori
    });

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

router.post('/poruke/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const { username_primalac, poruka, username_posiljalac } = req.body;

    const insertQuery = `
      INSERT INTO poruke (username_posiljalac, username_primalac, poruka)
      VALUES ($1, $2, $3)
      RETURNING *;`;

    const values = [username_posiljalac, username_primalac, poruka];

    const insertedMessageInfo = await client.query(insertQuery, values);

    res.redirect(`/menadzer/poruke/${id_menadzer}`);

    // Oslobadja resurse konekcije
    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

// GET za prikaz forme za kreiranje projekta
router.get('/projekti/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const radniciResult = await client.query('SELECT * FROM radnik');

    const menadzerResult = await client.query(
        'SELECT * FROM menadzer WHERE id_menadzer = $1',
        [id_menadzer]
    );
    const menadzer = menadzerResult.rows[0];

    const projektiResult = await client.query(
        'SELECT * FROM projekti WHERE id_menadzer = $1',
        [id_menadzer]
    );

    const projekti = projektiResult.rows;

    for (let i = 0; i < projekti.length; i++) {
      const taskoviResult = await client.query(
          'SELECT taskovi.*, radnik.username_radnik, radni_sati.utroseno_vrijeme ' +
          'FROM taskovi ' +
          'LEFT JOIN radnik ON taskovi.id_radnik = radnik.id_radnik ' +
          'LEFT JOIN radni_sati ON taskovi.id_taska = radni_sati.id_taska ' +
          'WHERE taskovi.id_projekta = $1',
          [projekti[i].id]
      );

      projekti[i].taskovi = taskoviResult.rows;
    }

    res.render('menadzer/projekti', {
      title: 'Projekti',
      id_menadzer: id_menadzer,
      radnici: radniciResult.rows,
      menadzer: menadzer,
      projekti: projekti,
    });

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

// POST za obradu podataka iz forme i kreiranje projekta i taskova
router.post('/projekti/:id_menadzer', async (req, res) => {
  console.info('Received request body:', req.body);

  const id_menadzer = req.params.id_menadzer;

  let id_projekta;

  try {
    const client = await pool.connect();

    const { naziv, opis, startni_datum, zavrsni_datum, brojTaskova } = req.body;

    // niz koji cuva taskove projekta
    const taskovi = [];

    for (let i = 0; i < brojTaskova; i++) {
      const task = {
        naziv: req.body[`taskovi[${i}][naziv]`],
        id_radnik: req.body[`taskovi[${i}][id_radnik]`],
      };

      taskovi.push(task);
    }
    console.info('Received taskovi:', taskovi);

    const insertProjectQuery = `
      INSERT INTO projekti (naziv, opis, startni_datum, zavrsni_datum, id_menadzer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const projectValues = [naziv, opis, startni_datum, zavrsni_datum, id_menadzer];
    const { rows: newProject } = await client.query(insertProjectQuery, projectValues);

    id_projekta = newProject[0].id;
    console.info('id projekta:', id_projekta);

    const insertTaskQuery = `
      INSERT INTO taskovi (naziv, id_projekta, id_radnik)
      VALUES ($1, $2, $3);
    `;

    if (Array.isArray(taskovi)) {
      const taskValues = taskovi.map(task => [task.naziv, id_projekta, task.id_radnik]);
      await Promise.all(taskValues.map(values => client.query(insertTaskQuery, values)));
    } else {
      console.error('No tasks provided or tasks is not an array.');
    }

    res.redirect(`/menadzer/projekti/${id_menadzer}`);
    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

router.get('/rang-lista/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;

  try {
    const client = await pool.connect();

    const menadzerResult = await client.query(
        'SELECT * FROM menadzer WHERE id_menadzer = $1',
        [id_menadzer]
    );
    const menadzer = menadzerResult.rows[0];

    // Menadžeri - Završeni projekti
    const menadzeriQuery = `
      SELECT m.id_menadzer, m.ime_menadzer, m.prezime_menadzer, m.username_menadzer, COALESCE(COUNT(DISTINCT subquery.id), 0) AS zavrseni_projekti
      FROM menadzer m
      LEFT JOIN (
        SELECT pr.id, pr.id_menadzer
        FROM projekti pr
        LEFT JOIN taskovi t ON pr.id = t.id_projekta
        LEFT JOIN radni_sati rs ON t.id_taska = rs.id_taska
        GROUP BY pr.id, pr.id_menadzer
        HAVING COUNT(DISTINCT t.id_taska) = COUNT(DISTINCT CASE WHEN rs.utroseno_vrijeme IS NOT NULL THEN t.id_taska END)
      ) subquery ON m.id_menadzer = subquery.id_menadzer
      GROUP BY m.id_menadzer
      ORDER BY zavrseni_projekti DESC;
    `;

    const menadzeriResult = await pool.query(menadzeriQuery);
    const menadzeri = menadzeriResult.rows.map((menadzer, index) => ({
      rank: index + 1,
      ime_menadzer: menadzer.ime_menadzer,
      prezime_menadzer: menadzer.prezime_menadzer,
      username_menadzer: menadzer.username_menadzer,
      zavrseni_projekti: menadzer.zavrseni_projekti,
    }));

    // Radnici - Završeni taskovi
    const radniciQuery = `
      SELECT r.id_radnik, r.ime_radnik, r.prezime_radnik, r.username_radnik, COALESCE(COUNT(DISTINCT id_taska), 0) AS zavrseni_taskovi
      FROM radnik r
      LEFT JOIN (
        SELECT t.id_taska, t.id_radnik
        FROM taskovi t
        LEFT JOIN radni_sati rs ON t.id_taska = rs.id_taska
        WHERE rs.utroseno_vrijeme IS NOT NULL
      ) subquery ON r.id_radnik = subquery.id_radnik
      GROUP BY r.id_radnik
      ORDER BY zavrseni_taskovi DESC;
    `;

    const radniciResult = await pool.query(radniciQuery);
    const radnici = radniciResult.rows.map((radnik, index) => ({
      rank: index + 1,
      ime_radnik: radnik.ime_radnik,
      prezime_radnik: radnik.prezime_radnik,
      username_radnik: radnik.username_radnik,
      zavrseni_taskovi: radnik.zavrseni_taskovi,
    }));

    res.render('menadzer/rang-lista', { title: 'Rang lista', menadzeri, radnici, menadzer: menadzer, trenutniMenadzerUsername: menadzer.username_menadzer, });
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
