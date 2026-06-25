const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'civictrackguard'
    });
    const [rows] = await conn.query('SELECT id, title, image_url FROM issues');
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error(err.message);
  }
}
run();
