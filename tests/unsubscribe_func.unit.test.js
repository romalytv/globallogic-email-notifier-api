const { unsubscribe } = require('../routes/controllers/subscription');
const db = require('../routes/db/index');

jest.mock('../routes/db/index');

describe('Unsubscribe Endpoint Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('unsubscribe()', () => {
        test('returns 400 if token format is invalid', async () => {
            req.params = { token: '123' };
            await unsubscribe(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 404 if token not found for deletion', async () => {
            req.params = { token: 'c'.repeat(64) };
            db.query.mockResolvedValueOnce({ rowCount: 0 });
            await unsubscribe(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token not found.' });
        });

        test('returns 200 if unsubscribed successfully', async () => {
            req.params = { token: 'd'.repeat(64) };
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            await unsubscribe(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unsubscribed succesfully' });
        });
    });
});