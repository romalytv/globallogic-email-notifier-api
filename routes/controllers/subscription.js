const crypto = require('crypto');
const db = require('../db/index');
const { sendConfirmationEmail } = require('../services/email');
const { verifyGitHubRepo } = require('../services/github');

async function subscribe(req, res) {
    const { email, repo } = req.body;

    if (!email || !repo) {
        return res.status(400).json({ error: 'Email and repo are required' });
    }

    const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    if (!repoRegex.test(repo)) {
        return res.status(400).json({ error: 'Incorrect repo address. Must be owner/repo' });
    }

    try {
        const repoExists = await verifyGitHubRepo(repo);
        if (!repoExists) {
            return res.status(404).json({ error: 'Repository not found on Github' });
        }

        let repoId;
        const checkRepoRes = await db.query('SELECT id FROM repositories WHERE name = $1', [repo]);

        if (checkRepoRes.rows.length > 0) {
            repoId = checkRepoRes.rows[0].id;
        } else {
            const insertRepoRes = await db.query(
                'INSERT INTO repositories (name) VALUES ($1) RETURNING id',
                [repo]
            );
            repoId = insertRepoRes.rows[0].id;
        }

        const token = crypto.randomBytes(32).toString('hex');
        console.log(`[DEV] Token generated for  ${email}: ${token}`);

        const checkSubRes = await db.query(
            'SELECT status FROM subscriptions WHERE email = $1 AND repo_id = $2',
            [email, repoId]
        );

        if (checkSubRes.rows.length > 0) {
            return res.status(409).json({ error: 'Email already subscribed to this repository' });
        }

        const insertSubQuery = `
          INSERT INTO subscriptions (email, repo_id, token, status) 
          VALUES ($1, $2, $3, 'pending')
          ON CONFLICT (email, repo_id) DO UPDATE 
          SET token = EXCLUDED.token, status = 'pending'
          RETURNING *;
        `;
        await db.query(insertSubQuery, [email, repoId, token]);

        await sendConfirmationEmail(email, repo, token);

        res.status(200).json({ message: 'Email for confirmation send on ' + email });

    } catch (error) {
        if (error.status === 429) {
            return res.status(429).json({ error: 'Too many call to GitHub API. Try later.' });
        }
        console.error('Subscription error subscription endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function confirm(req, res) {
    const { token } = req.params;

    try {
        const result = await db.query(
            `UPDATE subscriptions SET status = 'active' WHERE token = $1 RETURNING *`,
            [token]
        );

        if (!token || token.length !== 64) {
            return res.status(400).json({ error: 'Invalid token format' });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Token not found.' });
        }

        res.status(200).json({ message: 'Subscription successfully confirmed' });
    } catch (error) {
        console.error('Subscription error confirmation endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function unsubscribe(req, res) {
    const { token } = req.params;

    try {
        const result = await db.query(
            `DELETE FROM subscriptions WHERE token = $1 RETURNING *`,
            [token]
        );

        if (!token || token.length !== 64) {
            return res.status(400).json({ error: 'Invalid token format' });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Token not found.' });
        }

        res.status(200).json({ message: 'Unsubscribed succesfully' });
    } catch (error) {
        console.error('Subscription error unsubscription endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getSubscriptions(req, res) {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {

        const query = `
            SELECT s.email, r.name AS repo, s.status, r.last_seen_tag
            FROM subscriptions s
            JOIN repositories r ON s.repo_id = r.id
            WHERE s.email = $1
        `;
        const result = await db.query(query, [email]);

        const formattedSubscriptions = result.rows.map(row => ({
            email: row.email,
            repo: row.repo,
            confirmed: row.status === 'active',
            last_seen_tag: row.last_seen_tag || null
        }));

        res.status(200).json(formattedSubscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    subscribe,
    confirm,
    unsubscribe,
    getSubscriptions
};