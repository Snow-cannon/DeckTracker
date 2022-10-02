import express from 'express';
import jwtSigner from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { db } from './database2.js';
import * as crypto from 'crypto';
const { sign, verify } = jwtSigner;

const apiRoute = express.Router();

apiRoute.use(express.urlencoded({ extended: true }));
apiRoute.use(express.json());
apiRoute.use(cookieParser());

export const SUPER_SECRET = process.env.JWT_SECRET || '8253c11f1244dd66854a126f537d68c350527cebb5678da5c05410e51ddbe32587a3464be4867aa5367f7b4bd4f23fd795ab61b0eed63a30e5f47c73384f222e';

//Helper function to hash passwords
async function hash(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(8).toString("hex")

        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'))
        });
    })
}

async function verifyPass(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":")
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key == derivedKey.toString('hex'))
        });
    })
}

function validateUser(token) {
    try {
        const tokenDecodedData = verify(token, SUPER_SECRET);
        if (tokenDecodedData === undefined) {
            return ({
                ok: false,
            });
        }
        return ({
            ok: true,
            data: tokenDecodedData
        });
    } catch (error) {
        return ({
            ok: false,
            //data: error
        });
    }
}

// Adds a new User
apiRoute.put('/users', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            //No response on bad email/password
            return res.status(400).send();
        }
        const e = email;
        const pass = await hash(password);

        const result = await db.createNewUser(e, pass); //TODO: Create this function in the database
        if (result) {
            const signedJWT = sign({ user: result }, SUPER_SECRET, { expiresIn: '1 day' });
            res.cookie('auth', signedJWT, { maxAge: 43200000 });
            res.status(201).send();
        }
        else {
            res.status(409).send(); //User already exists / Cannot exist
        }
    } catch (e) {
        res.status(500).send();
    }
});

//Logs in a user
apiRoute.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await db.getUserFromEmail(email);//TODO: Create function in database
        if (user !== undefined && await verifyPass(password, user.password)) {
            const signedJWT = sign({ user: user.email }, SUPER_SECRET, { expiresIn: '1 day' });
            res.cookie('auth', signedJWT, { maxAge: 43200000 });
            res.status(200).send();
        }
        else {
            res.status(401).send('Password not validated');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
});

//Importing deck list
apiRoute.put('/users/decks', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);
    if (!authInfo.ok) {
        return res.status(401).send();
    }
    const body = req.body;
    let dbResponse = await db.importDeck(authInfo.data.user, body.deckContent, body.deckName); //TODO: Database function to import deck object and assign cards to user
    if (!dbResponse) {
        return res.status(422).send({ res: dbResponse });
    }
    res.status(201).send({ did: dbResponse });
});

//Delete a specific deck
apiRoute.delete('/users/decks', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.deleteDeck(authInfo.data.user, req.body.deckID); //TODO: Database function to delete based on deckID VALIDATE THE USER IS THE RIGHT ONE
    if (!dbResponse) {
        return res.status(400).send();
    }
    res.status(202).send(dbResponse);
});

//Get a users decks
apiRoute.get('/users/decks', async (req, res) => {
    // If we are not validated, return a 401 error
    const authInfo = validateUser(req.cookies["auth"]);
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.getUserDecks(authInfo.data.user);
    if (!dbResponse) {
        return res.status(400).send();
    }
    return res.status(200).send({ data: dbResponse });
});

apiRoute.post('/users/decks/content', async (req, res) => {
    // If we are not validated, return a 401 error
    const authInfo = validateUser(req.cookies["auth"]);
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const body = req.body;
    const dbResponse = await db.getDeckContents(body.deckId);
    if (!dbResponse) {
        return res.status(400).send();
    }
    return res.status(200).send({ data: dbResponse });
});

//Get all cards in a users collection
apiRoute.get('/users/collection', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.getUserCollection(authInfo.data.user); //TODO: Database function to get all decks for requesting user
    if (!dbResponse) {
        return res.status(400).send();
    }
    res.status(201).send({ data: dbResponse });
});

//Update a users collection
apiRoute.patch('/users/collection', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.addToCollection(authInfo.data.user, req.body.cardName, req.body.totalAmount); //TODO: Database function to update collection data
    if (!dbResponse) {
        return res.status(400).send();
    }
    res.status(200).send();
});

apiRoute.get('/cards', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.getAllCardData(); //TODO: Database function to update collection data
    if (!dbResponse) {
        return res.status(400).send();
    }
    res.status(200).send({ data: dbResponse });
});


export default apiRoute;