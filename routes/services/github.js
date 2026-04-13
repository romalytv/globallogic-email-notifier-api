const axios = require('axios');

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
    }
});

async function verifyGitHubRepo(repoFullName) {
    try {
        await githubApi.get(`/repos/${repoFullName}`);
        return true;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 404) {
                return false;
            }
            if (error.response.status === 403 || error.response.status === 429) {
                console.error('GitHub API Rate Limit exceeded');
                const err = new Error('Rate limit exceeded');
                err.status = 429;
                throw err;
            }
        }
        throw error;
    }
}

module.exports = { verifyGitHubRepo };