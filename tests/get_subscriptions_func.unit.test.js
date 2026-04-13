const { getSubscriptions } = require('../routes/controllers/subscription');
const db = require('../routes/db/index');

jest.mock('../routes/db/index');

describe('All Subscription Endpoint Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('returns 400 if email query parameter is missing', async () => {
        req.query = {};
        await getSubscriptions(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    test('returns 200 with formatted subscriptions list', async () => {
        req.query = { email: 'test@test.com' };
        const dbRows = [
            { email: 'test@test.com', repo: 'nodejs/node', status: 'active', last_seen_tag: 'v20.0.0' },
            { email: 'test2@test.com', repo: 'facebook/react', status: 'pending', last_seen_tag: null }
        ];
        db.query.mockResolvedValueOnce({ rows: dbRows });

        await getSubscriptions(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { email: 'test@test.com', repo: 'nodejs/node', confirmed: true, last_seen_tag: 'v20.0.0' },
            { email: 'test2@test.com', repo: 'facebook/react', confirmed: false, last_seen_tag: null }
        ]);
    });

    test('returns 200 with an empty array if no subscriptions found', async () => {
        req.query = { email: 'newtestuser@test.com' };
        db.query.mockResolvedValueOnce({ rows: [] });
        await getSubscriptions(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('returns 500 if database query fails', async () => {
        req.query = { email: 'test@test.com' };
        db.query.mockRejectedValue(new Error('Database error'));
        await getSubscriptions(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});