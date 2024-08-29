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
  res.render('login', { title: 'Prijava' });
});

router.get('/loginMenadzer', function(req, res, next) {
  res.render('loginMenadzer', { title: 'Prijava menadžera' });
});

router.post('/loginMenadzer', async function(req, res, next) {
  const { username_menadzer, lozinka_menadzer } = req.body;
  console.info('Uneseni podaci:', username_menadzer, lozinka_menadzer);

  try {
    const client = await pool.connect();

    // Provjerava da li korisnik postoji
    const result = await client.query(`SELECT * FROM menadzer WHERE username_menadzer = $1`, [username_menadzer]);
    console.info('Rezultat iz baze:', result.rows);

    if (result.rows.length === 0) {
      res.render('loginMenadzer', { title: 'Prijava menadžera', error: 'Pogrešan username.' });
    } else {
      const menadzer = result.rows[0];

      // U dijelu koda gdje uspoređujete hash lozinke
      console.info('Hash iz baze:', menadzer.lozinka_menadzer);
      console.info('Hash generiran iz lozinke:', lozinka_menadzer);

      // Provjerava lozinku koristeći bcrypt
      const isPasswordValid = await bcrypt.compare(lozinka_menadzer, menadzer.lozinka_menadzer);
      console.info('Usporedba rezultata:', isPasswordValid);

      if (isPasswordValid) {
        // Lozinka je ispravna
        res.render('menadzer/menadzer-profil', { title: 'Menadžer Profil', menadzer: menadzer});

      } else {
        // Pogrešna lozinka
        res.render('loginMenadzer', { title: 'Prijava menadžera', error: 'Pogrešna lozinka.' });
      }
    }

    client.release();
  } catch (error) {
    console.error('Greška prilikom prijave:', error);
    res.render('login', { title: 'Prijava', error: 'Došlo je do greške prilikom prijave.' });
  }
});

router.get('/loginRadnik', function(req, res, next) {
  res.render('loginRadnik', { title: 'Prijava radnika' });
});

router.post('/loginRadnik', async function(req, res, next) {
  const { username_radnik, lozinka_radnik } = req.body;
  console.info('Uneseni podaci:', username_radnik, lozinka_radnik);

  try {
    const client = await pool.connect();

    // Provjerava da li korisnik postoji
    const result = await client.query(`SELECT * FROM radnik WHERE username_radnik = $1`, [username_radnik]);
    console.info('Rezultat iz baze:', result.rows);

    if (result.rows.length === 0) {
      res.render('loginRadnik', { title: 'Prijava radnika', error: 'Pogrešan username.' });
    } else {
      const radnik = result.rows[0];

      // U dijelu koda gdje uspoređujete hash lozinke
      console.info('Hash iz baze:', radnik.lozinka_radnik);
      console.info('Hash generiran iz lozinke:', lozinka_radnik);

      // Provjerava lozinku koristeći bcrypt
      const isPasswordValid = await bcrypt.compare(lozinka_radnik, radnik.lozinka_radnik);
      console.info('Usporedba rezultata:', isPasswordValid);

      if (isPasswordValid) {
        // Lozinka je ispravna
        res.render('radnik/radnik-profil', { title: 'Radnik Profil', radnik: radnik});

      } else {
        // Pogrešna lozinka
        res.render('loginRadnik', { title: 'Prijava radnika', error: 'Pogrešna lozinka.' });
      }
    }

    client.release();
  } catch (error) {
    console.error('Greška prilikom prijave:', error);
    res.render('login', { title: 'Prijava', error: 'Došlo je do greške prilikom prijave.' });
  }
});

module.exports = router;
