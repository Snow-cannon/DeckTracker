import express from 'express';
import { db } from './database.js';

const dbRoute = express.Router();

dbRoute.post('/createCard', async (req, res) => {
    let result = await db.createCard(req.body);
    res.json({ ok: result.ok });
});

dbRoute.get('/selectCard', async (req, res) => {
    let result = await db.selectCard(req.body);
    res.json({ ok: result.ok, rows: result.rows });
});

dbRoute.post('/updateCard', async (req, res) => {
    let result = await db.updateCard(req.body);
    res.json({ ok: result.ok });
});

dbRoute.post('/deleteCard', async (req, res) => {
    let result = await db.deleteCard(req.body);
    res.json({ ok: result.ok });
});

export default dbRoute;