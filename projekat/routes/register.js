var express = require('express');
var router = express.Router();
var pg = require('pg');
var bcrypt = require('bcrypt');

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

router.get('/', function(req, res, next) {
  res.render('register', { title: 'Registracija' });
});

router.get('/registerMenadzer', function(req, res, next) {
  res.render('registerMenadzer', { title: 'Registracija menadžera' });
});

router.get('/registerRadnik', function(req, res, next) {
  res.render('registerRadnik', { title: 'Registracija radnika' });
});

router.post('/registerMenadzer', async (req,res) => {
  try {
    const {
      ime_menadzer,
      prezime_menadzer,
      username_menadzer,
      lozinka_menadzer,
      email_menadzer,
      datumrodjenja_menadzer,
      nazivkompanije_menadzer
    } = req.body;

    const existingMenadzer = await pool.query(`SELECT * FROM menadzer WHERE username_menadzer = $1`, [username_menadzer]);
    const existingRadnik = await pool.query(`SELECT * FROM radnik WHERE username_radnik = $1`, [username_menadzer]);

    if (existingMenadzer.rows.length > 0 || existingRadnik.rows.length > 0) {
      res.render('registerMenadzer', { title: 'Registracija menadžera', error: 'Username zauzet.' });
    }

    const hashedPassword = await bcrypt.hash(lozinka_menadzer, 10);

    const result = await pool.query(`
      INSERT INTO menadzer (ime_menadzer, prezime_menadzer, username_menadzer, lozinka_menadzer, email_menadzer, datumrodjenja_menadzer, nazivkompanije_menadzer)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_menadzer`,
        [ime_menadzer, prezime_menadzer, username_menadzer, hashedPassword, email_menadzer, datumrodjenja_menadzer, nazivkompanije_menadzer]
    );

    const id_menadzer = result.rows[0].id_menadzer;
    res.redirect(`/menadzer/menadzer-profil/${id_menadzer}`);

  } catch (error) {
    console.error('Greška prilikom registracije:', error);
    res.render('register', { title: 'Registracija', error: 'Došlo je do greške prilikom registracije.'});
  }
});

router.post('/registerRadnik', async (req,res) => {
  try {
    const {
      ime_radnik,
      prezime_radnik,
      username_radnik,
      lozinka_radnik,
      email_radnik,
      datumrodjenja_radnik,
      nazivkompanije_radnik
    } = req.body;

    const existingMenadzer = await pool.query(`SELECT * FROM menadzer WHERE username_menadzer = $1`, [username_radnik]);
    const existingRadnik = await pool.query(`SELECT * FROM radnik WHERE username_radnik = $1`, [username_radnik]);

    if (existingMenadzer.rows.length > 0 || existingRadnik.rows.length > 0) {
      res.render('registerRadnik', { title: 'Registracija radnika', error: 'Username zauzet.' });
    }

    const hashedPassword = await bcrypt.hash(lozinka_radnik, 10);

    const result = await pool.query(`
      INSERT INTO radnik (ime_radnik, prezime_radnik, username_radnik, lozinka_radnik, email_radnik, datumrodjenja_radnik, nazivkompanije_radnik)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_radnik`,
        [ime_radnik, prezime_radnik, username_radnik, hashedPassword, email_radnik, datumrodjenja_radnik, nazivkompanije_radnik]
    );

    const id_radnik = result.rows[0].id_radnik;
    res.redirect(`/radnik/radnik-profil/${id_radnik}`);

  } catch (error) {
    console.error('Greška prilikom registracije:', error);
    res.render('register', { title: 'Registracija', error: 'Došlo je do greške prilikom registracije.'});
  }
});

module.exports = router;
