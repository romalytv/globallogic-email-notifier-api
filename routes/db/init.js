const db = require('./index');

async function initDatabase() {
    const createRepositoriesTable = `
    CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      last_seen_tag VARCHAR(100)
    );
  `;

    const createSubscriptionsTable = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      repo_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
      token VARCHAR(100) UNIQUE,
      status VARCHAR(50) DEFAULT 'pending',
      UNIQUE(email, repo_id)
    );
  `;

    try {
        await db.query(createRepositoriesTable);
        await db.query(createSubscriptionsTable);
        console.log('DB tables initialized successfully.');
    } catch (err) {
        console.error('Error starting DB:', err);
        throw err;
    }
}

module.exports = { initDatabase };