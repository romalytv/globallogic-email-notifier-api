const { subscribe } = require('../routes/controllers/subscription');
const db = require('../routes/db/index');
const { verifyGitHubRepo } = require('../routes/services/github');
const { sendConfirmationEmail } = require('../routes/services/email');

jest.mock('../routes/db/index');
jest.mock('../routes/services/github');
jest.mock('../routes/services/email');

describe('Subscription Controller: subscribe()', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('returns 400 if email or repo is missing', async () => {
        req.body = { email: 'test@test.com' };
        await subscribe(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email and repo are required' });
    });

    test('returns 400 if repository format is invalid', async () => {
        req.body = { email: 'test@test.com', repo: 'just-nodejs' };
        await subscribe(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Incorrect repo address. Must be owner/repo' });
    });

    test('returns 404 if repository does not exist on GitHub', async () => {
        req.body = { email: 'test@test.com', repo: 'non-existent/repo' };
        verifyGitHubRepo.mockResolvedValue(false);
        await subscribe(req, res);
        expect(verifyGitHubRepo).toHaveBeenCalledWith('non-existent/repo');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Repository not found on Github' });
    });

    test('returns 409 if subscription already exists', async () => {
        req.body = { email: 'test@test.com', repo: 'facebook/react' };
        verifyGitHubRepo.mockResolvedValue(true);
        // SQL queries sequence in controllers
        db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        db.query.mockResolvedValueOnce({ rows: [{ status: 'active' }] });
        await subscribe(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email already subscribed to this repository' });
        expect(sendConfirmationEmail).not.toHaveBeenCalled();
    });

    test('returns 429 if GitHub API rate limit is exceeded', async () => {
        req.body = { email: 'test@test.com', repo: 'facebook/react' };
        verifyGitHubRepo.mockRejectedValue({ status: 429 });
        await subscribe(req, res);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({ error: 'Too many call to GitHub API. Try later.'})
    });

    test('returns 200 on successful subscription', async () => {
        req.body = { email: 'test@test.com', repo: 'facebook/react' };
        verifyGitHubRepo.mockResolvedValue(true);
        // SQL queries sequence in controllers
        db.query.mockResolvedValueOnce({ rows: [] });
        db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        db.query.mockResolvedValueOnce({ rows: [] });
        db.query.mockResolvedValueOnce({ rows: [{ id: 100 }] });
        sendConfirmationEmail.mockResolvedValue(true);
        await subscribe(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
    });
});