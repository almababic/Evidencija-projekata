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

router.get('/radnik-profil/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const result = await client.query(
        'SELECT * FROM radnik WHERE id_radnik = $1',
        [id_radnik]
    );

    if (result.rows.length === 0) {
      res.status(404).render('error', { error: 'Radnik nije pronadjen' });
    } else {
      const radnik = result.rows[0];
      res.render('radnik/radnik-profil', {
        title: 'Radnik Profil',
        radnik: radnik,
      });
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
    // Handle the error (e.g., render an error page)
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

router.get('/ocjene/:id_radnik', async (req, res, next) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const result = await client.query(
        `SELECT * FROM radnik WHERE id_radnik = $1`,
        [id_radnik]
    );

    if (result.rows.length === 0) {
      res.status(404).render('error', { error: 'Radnik nije pronadjen' });
    } else {
      const radnik = result.rows[0];
      res.render('radnik/ocjene', {
        title: 'Ocjenjivanje aplikacije',
        radnik: radnik,
      });
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

router.post('/ocjene/:id_radnik', async (req, res) => {
  try {
    const client = await pool.connect();

    const {
      ime_radnik,
      prezime_radnik,
      username_radnik,
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
      ime_radnik,
      prezime_radnik,
      username_radnik,
      ocjena1,
      ocjena2,
      ocjena3,
      ocjena4,
      ocjena5,
      komentar,
    ];

    await client.query(insertQuery, values);

    const id_radnik = req.params.id_radnik;

    res.redirect(`/radnik/radnik-profil/${id_radnik}`);

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

router.get('/poruke/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const radnikResult = await client.query(
        `SELECT * FROM radnik WHERE id_radnik = $1`,
        [id_radnik]
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
        [radnikResult.rows[0].username_radnik]
    );

    const poruke = porukeResult.rows;
    const radnik = radnikResult.rows[0];
    const radnici = radniciResult.rows;
    const menadzeri = menadzeriResult.rows;
    const administratori = administratoriResult.rows;

    res.render('radnik/poruke', {
      title: 'Poruke',
      radnik: radnik,
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

router.post('/poruke/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const { username_primalac, poruka, username_posiljalac } = req.body;

    const insertQuery = `
      INSERT INTO poruke (username_posiljalac, username_primalac, poruka)
      VALUES ($1, $2, $3)
      RETURNING *;`;

    const values = [username_posiljalac, username_primalac, poruka];

    const insertedMessageInfo = await client.query(insertQuery, values);

    res.redirect(`/radnik/poruke/${id_radnik}`);

    // Oslobadja resurse konekcije
    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

router.get('/projekti/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const radnikResult = await client.query(
        `SELECT * FROM radnik WHERE id_radnik = $1`,
        [id_radnik]
    );

    const radnik = radnikResult.rows[0];

    // Dobijanje projekata i taskova za određenog radnika
    const projektiResult = await client.query(
        `SELECT DISTINCT ON (p.id) p.id AS id_projekta, p.naziv AS naziv_projekta, 
        t.id_taska, t.naziv AS task_naziv,
        p.opis AS opis_projekta, p.startni_datum, p.zavrsni_datum
 FROM projekti p
 LEFT JOIN taskovi t ON p.id = t.id_projekta AND t.id_radnik = $1
 WHERE t.id_radnik = $1
 ORDER BY p.id, t.id_taska ASC;`,
        [id_radnik]
    );

    const projekti = [];

    for (const projekatResult of projektiResult.rows) {
      const taskoviResult = await client.query(
          `SELECT t.id_taska, t.naziv AS task_naziv
         FROM taskovi t
         WHERE t.id_projekta = $1 AND t.id_radnik = $2`,
          [projekatResult.id_projekta, id_radnik]
      );

      const taskovi = taskoviResult.rows;

      // Fetch utroseno_vrijeme for each task
      for (const task of taskovi) {
        const utrosenoVrijemeResult = await client.query(
            'SELECT utroseno_vrijeme FROM radni_sati WHERE id_radnik = $1 AND id_projekta = $2 AND id_taska = $3',
            [id_radnik, projekatResult.id_projekta, task.id_taska]
        );

        if (utrosenoVrijemeResult.rows.length > 0) {
          task.utroseno_vrijeme = utrosenoVrijemeResult.rows[0].utroseno_vrijeme;
        }
      }

      // Dodajte taskove u objekat projekta
      const projekat = {
        id_projekta: projekatResult.id_projekta,
        naziv_projekta: projekatResult.naziv_projekta,
        opis_projekta: projekatResult.opis_projekta,
        startni_datum: new Date(projekatResult.startni_datum).toLocaleDateString(),
        zavrsni_datum: new Date(projekatResult.zavrsni_datum).toLocaleDateString(),
        taskovi: taskovi,
      };

      projekti.push(projekat);
    }

    res.render('radnik/projekti', {
      title: 'Projekti',
      radnikId: id_radnik,
      projekti: projekti,
      radnik: radnik
    });

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

router.post('/unos-radnih-sati/:id_radnik/:id_projekta/:id_taska', async (req, res) => {
  const id_radnik = req.params.id_radnik;
  const id_projekta = req.params.id_projekta;
  const id_taska = req.params.id_taska;

  try {
    const client = await pool.connect();

    const { utroseno_vrijeme } = req.body;

    // Provera da li je task već ima uneto vreme
    const existingTimeResult = await client.query(
        'SELECT utroseno_vrijeme FROM radni_sati WHERE id_radnik = $1 AND id_projekta = $2 AND id_taska = $3',
        [id_radnik, id_projekta, id_taska]
    );

    if (existingTimeResult.rows.length === 0) {
      // Ako nema unetog vremena, dodajte novi unos
      const insertQuery = `
        INSERT INTO radni_sati (id_radnik, id_projekta, id_taska, utroseno_vrijeme, datum)
        VALUES ($1, $2, $3, $4, CURRENT_DATE);
        `;

      const values = [id_radnik, id_projekta, id_taska, utroseno_vrijeme];

      await client.query(insertQuery, values);

      res.redirect(`/radnik/projekti/${id_radnik}`);
    } else {
      // Ako već postoji uneto vreme, možete preusmeriti ili prikazati poruku
      res.status(400).send('Radno vrijeme već uneseno za ovaj task.');
    }

    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { message: 'Internal Server Error', error: error });
  }
});

router.get('/rang-lista/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;

  try {
    const client = await pool.connect();

    const radnikResult = await client.query(
        'SELECT * FROM radnik WHERE id_radnik = $1',
        [id_radnik]
    );
    const radnik = radnikResult.rows[0];

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

    res.render('radnik/rang-lista', { title: 'Rang lista', menadzeri, radnici, radnik: radnik, trenutniRadnikUsername: radnik.username_radnik, });
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
