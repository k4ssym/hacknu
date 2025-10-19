import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgres://vkorzinka_user:x8jKWP3GWNMmlXgB9wcXtuvgy0PNk1YE@dpg-d15h3pm3jp1c73ft79rg-a.oregon-postgres.render.com:5432/vkorzinka_db",
  ssl: {
    rejectUnauthorized: false // Required for Render's SSL
  }
});

async function checkUser() {
  try {
    const res = await pool.query(
      "SELECT id, email, is_verified FROM users WHERE email = $1", 
      ['ielts.taraz@gmail.com']
    );
    console.log('User found:', res.rows[0] || 'Not found');
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
  }
}

checkUser();