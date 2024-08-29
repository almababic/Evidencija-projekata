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
  res.render('admin-login', { title: 'Prijava' });
});

router.post('/', async function(req, res, next) {
  const { username_admin, lozinka_admin } = req.body;
  console.info('Uneseni podaci:', username_admin, lozinka_admin);

  try {
    const client = await pool.connect();

    // Provjerava da li korisnik postoji
    const result = await client.query(`SELECT * FROM administrator WHERE username_admin = $1`, [username_admin]);
    console.info('Rezultat iz baze:', result.rows);

    if (result.rows.length === 0) {
      res.render('admin-login', { title: 'Prijava', error: 'Pogrešan username.' });
    } else {
      const admin = result.rows[0];

      // U dijelu koda gdje uspoređujete hash lozinke
      console.info('Hash iz baze:', admin.lozinka_admin);
      console.info('Hash generiran iz lozinke:', lozinka_admin);

      // Provjerava lozinku koristeći bcrypt
      const isPasswordValid = await bcrypt.compare(lozinka_admin, admin.lozinka_admin);
      console.info('Usporedba rezultata:', isPasswordValid);

      if (isPasswordValid) {
        // Lozinka je ispravna
        res.render('admin/admin-panel', { title: 'Admin Panel', username_admin: admin.username_admin });
      } else {
        // Pogrešna lozinka
        res.render('admin-login', { title: 'Prijava', error: 'Pogrešna lozinka.' });
      }
    }

    client.release();
  } catch (error) {
    console.error('Greška prilikom prijave:', error);
    res.render('admin-login', { title: 'Prijava', error: 'Došlo je do greške prilikom prijave.' });
  }
});

module.exports = router;
