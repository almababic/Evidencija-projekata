var express = require('express');
var router = express.Router();
var pg = require('pg');
var bcrypt = require('bcrypt');
const http = require('http').createServer(router);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const { Chart } = require('chart.js');
const { CanvasRenderService } = require('chartjs-node-canvas');

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

router.get('/admin-panel', function(req, res, next) {
  res.render('admin/admin-panel', { title: 'Admin Panel' });
});

router.get('/menadzeri', function(req, res, next) {
  pool.query(`SELECT * FROM menadzer`, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      const menadzeri = result.rows;
      res.render('admin/menadzeri', { title: 'Menadžeri', menadzeri: menadzeri });
    }
  });
});

router.get('/radnici', function(req, res, next) {
  pool.query(`SELECT * FROM radnik`, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      const radnici = result.rows;
      res.render('admin/radnici', { title: 'Radnici', radnici: radnici });
    }
  });
});

router.delete('/obrisi-radnik/:id_radnik', async (req, res) => {
  const id_radnik = req.params.id_radnik;
  try {
    await pool.query('DELETE FROM radnik WHERE id_radnik = $1', [id_radnik]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error u brisanju radnika:', error);
    res.sendStatus(500);
  }
});

router.delete('/obrisi-menadzer/:id_menadzer', async (req, res) => {
  const id_menadzer = req.params.id_menadzer;
  try {
    await pool.query('DELETE FROM menadzer WHERE id_menadzer = $1', [id_menadzer]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error u brisanju menadzera:', error);
    res.sendStatus(500);
  }
});

router.get('/ocjene', function(req, res, next) {
  pool.query(`SELECT * FROM ocjene`, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      const ocjene = result.rows;
      console.info('Ocjene:', ocjene);
      res.render('admin/ocjene', { title: 'Ocjene korisnika', ocjene: ocjene });
    }
  });
});

router.get('/statistika', async function(req, res, next) {
  try {
    const radniciResult = await pool.query('SELECT COUNT(*) as count FROM radnik');
    const menadzeriResult = await pool.query('SELECT COUNT(*) as count FROM menadzer');

    const radniciCount = parseInt(radniciResult.rows[0].count);
    const menadzeriCount = parseInt(menadzeriResult.rows[0].count);

    const totalUsers = radniciCount + menadzeriCount;

    const firmsResult = await pool.query(`
      SELECT firma, SUM(count) AS user_count
      FROM (
        SELECT nazivkompanije_radnik AS firma, COUNT(*) AS count
        FROM radnik
        WHERE nazivkompanije_radnik IS NOT NULL
        GROUP BY nazivkompanije_radnik

        UNION ALL

        SELECT nazivkompanije_menadzer AS firma, COUNT(*) AS count
        FROM menadzer
        WHERE nazivkompanije_menadzer IS NOT NULL
        GROUP BY nazivkompanije_menadzer
      ) AS user_counts
      GROUP BY firma
    `);

    const firmsData = firmsResult.rows.map(row => ({
      firma: row.firma,
      count: parseInt(row.user_count),
    }));

    const firmsCount = await pool.query(`
      SELECT COUNT(DISTINCT firma) as count
      FROM (
        SELECT nazivkompanije_radnik AS firma
        FROM radnik
        WHERE nazivkompanije_radnik IS NOT NULL

        UNION ALL

        SELECT nazivkompanije_menadzer AS firma
        FROM menadzer
        WHERE nazivkompanije_menadzer IS NOT NULL
      ) AS user_counts
    `);

    const totalFirms = parseInt(firmsCount.rows[0].count);

    const ocjeneResult = await pool.query('SELECT * FROM ocjene');

    const ocjene = ocjeneResult.rows;

    // racunanje prosječne ocjene
    const averageDizajn = calculateAverageRatingForCategory(ocjene, 'dizajn');
    const averageFunkcionalnost = calculateAverageRatingForCategory(ocjene, 'funkcionalnost');
    const averageKomunikacija = calculateAverageRatingForCategory(ocjene, 'komunikacija');
    const averageBrzina = calculateAverageRatingForCategory(ocjene, 'brzina');
    const averageProjekat = calculateAverageRatingForCategory(ocjene, 'projekat');

    const projectsResult = await pool.query('SELECT * FROM projekti');
    const tasksResult = await pool.query('SELECT * FROM taskovi');
    const workHoursResult = await pool.query('SELECT * FROM radni_sati');

    const projects = projectsResult.rows;
    const tasks = tasksResult.rows;
    const workHours = workHoursResult.rows;

    const finishedProjectsCount = projects.filter(projekt => projectIsFinished(projekt, tasks, workHours)).length;
    const unfinishedProjectsCount = projects.length - finishedProjectsCount;

    const totalProjectsCount = projects.length;

    const completedTasksResult = await pool.query('SELECT * FROM radni_sati');
    const totalTasksCount = tasksResult.rows.length;
    const completedTasksCount = completedTasksResult.rows.length;
    const unfinishedTasksCount = totalTasksCount - completedTasksCount;

    res.render('admin/statistika', {
      title: 'Statistika',
      totalUsers,
      radniciCount,
      menadzeriCount,
      firmsData,
      totalFirms,
      averageDizajn,
      averageFunkcionalnost,
      averageKomunikacija,
      averageBrzina,
      averageProjekat,
      finishedProjectsCount,
      unfinishedProjectsCount,
      totalProjectsCount,
      completedTasksCount,
      unfinishedTasksCount,
      totalTasksCount,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Funkcija za računanje prosječne ocjene za određenu kategoriju
function calculateAverageRatingForCategory(ocjene, category) {
  const sum = ocjene.reduce((total, ocjena) => total + ocjena[category], 0);
  const average = sum / ocjene.length;
  return isNaN(average) ? 0 : average;
}

// f-ja koja vraca da li je projekat zavrsen (svi taskovi mu imaju uneseno utroseno vrijeme) ili nije
function projectIsFinished(project, tasks, workHours) {
  const projectTasks = tasks.filter(task => task.id_projekta === project.id);
  for (const task of projectTasks) {
    const taskWorkHours = workHours.filter(hour => hour.id_taska === task.id_taska);
    if (taskWorkHours.length === 0) {
      return false;
    }
  }
  return true;
}

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

router.get('/poruke', async (req, res) => {
  try {
    const client = await pool.connect();

    const adminResult = await client.query(
        `SELECT * FROM administrator`
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
        [adminResult.rows[0].username_admin]
    );

    const poruke = porukeResult.rows;
    const admin = adminResult.rows[0];
    const radnici = radniciResult.rows;
    const menadzeri = menadzeriResult.rows;
    const administratori = administratoriResult.rows;

    res.render('admin/poruke', {
      title: 'Poruke',
      admin: admin,
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

router.post('/poruke', async (req, res) => {
  try {
    const client = await pool.connect();

    const { username_primalac, poruka, username_posiljalac } = req.body;

    const insertQuery = `
      INSERT INTO poruke (username_posiljalac, username_primalac, poruka)
      VALUES ($1, $2, $3)
      RETURNING *;`;

    const values = [username_posiljalac, username_primalac, poruka];

    const insertedMessageInfo = await client.query(insertQuery, values);

    res.redirect(`/admin/poruke`);

    // Oslobadja resurse konekcije
    client.release();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
});

router.get('/projekti', async (req, res) => {
  try {
    const client = await pool.connect();

    // Upit za dobavljanje projekata zajedno sa povezanim zadacima i detaljima zadatka
    const rezultat = await client.query(`
      SELECT
        p.id,
        p.naziv,
        p.opis,
        p.startni_datum,
        p.zavrsni_datum,
        m.username_menadzer,
        t.naziv AS naziv_zadatka,
        r.username_radnik,
        r_s.utroseno_vrijeme,
        r_s.datum
      FROM
        projekti p
        LEFT JOIN menadzer m ON p.id_menadzer = m.id_menadzer
        LEFT JOIN taskovi t ON p.id = t.id_projekta
        LEFT JOIN radnik r ON t.id_radnik = r.id_radnik
        LEFT JOIN radni_sati r_s ON t.id_taska = r_s.id_taska
      ORDER BY
        p.startni_datum DESC, t.naziv
    `);

    const projekti = [];
    let trenutniProjekat = null;

    // Organizujte rezultate u struktuirani format
    rezultat.rows.forEach((red) => {
      if (!trenutniProjekat || trenutniProjekat.id !== red.id) {
        if (trenutniProjekat) {
          projekti.push(trenutniProjekat);
        }

        trenutniProjekat = {
          id: red.id,
          naziv: red.naziv,
          opis: red.opis,
          startni_datum: red.startni_datum,
          zavrsni_datum: red.zavrsni_datum,
          username_menadzer: red.username_menadzer,
          taskovi: [],
        };
      }

      if (red.naziv_zadatka) {
        trenutniProjekat.taskovi.push({
          naziv: red.naziv_zadatka,
          username_radnik: red.username_radnik,
          utroseno_vrijeme: red.utroseno_vrijeme,
          datum: red.datum,
        });
      }
    });

    if (trenutniProjekat) {
      projekti.push(trenutniProjekat);
    }

    client.release();

    res.render('admin/projekti', { title: 'Projekti', projekti: projekti });

  } catch (err) {
    console.error('Greška prilikom izvršavanja upita', err);
    res.status(500).send('Interna Server Greška');
  }
});

router.get('/rang-lista', async (req, res) => {
  try {
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

    res.render('admin/rang-lista', { title: 'Rang lista', menadzeri, radnici });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
