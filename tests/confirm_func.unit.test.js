const { confirm } = require('../routes/controllers/subscription');
const db = require('../routes/db/index');

jest.mock('../routes/db/index');

describe('Confirm Endpoint Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('confirm()', () => {
        test('returns 400 if token format is invalid', async () => {
            req.params = { token: 'invalid-short-token' };
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            await confirm(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
        });

        test('returns 404 if token does not exist', async () => {
            req.params = { token: 'a'.repeat(64) };
            db.query.mockResolvedValueOnce({ rowCount: 0 });
            await confirm(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token not found.' });
        });

        test('returns 200 if subscription confirmed successfully', async () => {
            req.params = { token: 'b'.repeat(64) };
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            await confirm(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Subscription successfully confirmed' });
        });
    });
});