const cron = require('node-cron');
const db = require('../db/index');
const axios = require('axios');
const { sendNewReleaseEmail } = require('../services/email');

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
    }
});

async function checkUpdates() {
    console.log(`New release fetching...`);

    try {
        const reposQuery = `
          SELECT DISTINCT r.id, r.name, r.last_seen_tag 
          FROM repositories r
          JOIN subscriptions s ON r.id = s.repo_id
          WHERE s.status = 'active'
        `;
        const { rows: repos } = await db.query(reposQuery);

        for (const repo of repos) {
            try {
                const response = await githubApi.get(`/repos/${repo.name}/releases/latest`);
                const latestTag = response.data.tag_name;

                if (latestTag !== repo.last_seen_tag) {
                    console.log(`Found new release for ${repo.name}: ${latestTag}`);

                    const { rows: subscribers } = await db.query(
                        'SELECT email, token FROM subscriptions WHERE repo_id = $1 AND status = \'active\'',
                        [repo.id]
                    );

                    for (const sub of subscribers) {
                        await sendNewReleaseEmail(sub.email, repo.name, latestTag, sub.token);
                    }

                    await db.query(
                        'UPDATE repositories SET last_seen_tag = $1 WHERE id = $2',
                        [latestTag, repo.id]
                    );
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.warn(`Repo ${repo.name} not available anymore.`);
                } else if (error.response?.status === 403 || error.response?.status === 429) {
                    console.error('Rate limit exceeded. Stop processing.');
                    return;
                }
            }
        }
    } catch (err) {
        console.error('Scanner critical error:', err);
    }
}

// сканер кожні півгодини (кожна година - 0, кожна хвилина - */1)
function startScanner() {
    cron.schedule('*/30 * * * *', checkUpdates);
}

module.exports = { startScanner };