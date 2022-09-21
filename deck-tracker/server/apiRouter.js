import express from 'express';
import jwtSigner from 'jsonwebtoken';
const { sign, verify } = jwtSigner;
import cookieParser from 'cookie-parser';
import { db } from './database.js';
import * as crypto from 'crypto';
// import { db } from './database.js'

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

// LOGIN
apiRoute.post('/login/passwd', async (req, res) => {
    const options = req.body;
    let user = await db.getUserFromEmail(options.email);
    if (user != undefined && await verifyPass(options.password, user.password)) {
        console.log(user.uid);
        const signedJWT = sign({ user: user.uid }, SUPER_SECRET, { expiresIn: '1 day' });
        res.cookie('auth', signedJWT, { maxAge: 43200000 });
        res.redirect("/personalProfile.html");
    }
    else {
        res.status(401).send('Password not validated');
    }
});

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

// Add a new User
apiRoute.put('/users/newUser', async (req, res) => {
    let options = req.body;
    const e = options.email;
    const pass = await hash(options.password);
    // const userName = options.username;

    const result = await db.createNewUser(e, pass); //TODO: Create this function in the database
    if (result.ok) {
        const signedJWT = sign({ user: result }, SUPER_SECRET, { expiresIn: '1 day' });
        res.cookie('auth', signedJWT, { maxAge: 43200000 });
        res.status(201).send();
    }
    else {
        return res.status(401).send();
    }
});


apiRoute.post('/login/passwd', async (req, res) => {
    const options = req.body;
    let user = await db.getUserFromEmail(options.email);//TODO: Create function in database
    if (user != undefined && await verifyPass(options.password, user.password)) {
        console.log(user.uid);
        const signedJWT = sign({ user: user.uid }, SUPER_SECRET, { expiresIn: '1 day' });
        res.cookie('auth', signedJWT, { maxAge: 43200000 });
        res.status(200).send();
    }
    else {
        res.status(401).send('Password not validated');
    }
});

apiRoute.put('/importDeck', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }

    const body = req.body;
    let dbResponse = await db.importDeck(authInfo.data.user, body.deckContent, body.deckName); //TODO: Database function to import deck object and assign cards to user
    if (!dbResponse.ok) {
        return res.status(422).send({ error: dbResponse.error, data: dbResponse.rows });
    }
    res.status(201).send();
});

apiRoute.get('/userLibrary', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.getUserLibrary(authInfo.data.user); //TODO: Database function to get all decks for requesting user
    if (!dbResponse.ok) {
        return res.status(400).send({ error: dbResponse.error, data: dbResponse.rows });
    }
    res.status(201).send(dbResponse.rows);
});

apiRoute.patch('/updateHas', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.updateUserHas(authInfo.data.user, req.body.cardName, req.body.totalAmount); //TODO: Database function to update collection data
    if (!dbResponse.ok) {
        return res.status(400).send({ error: dbResponse.error, data: dbResponse.rows });
    }
    res.status(201).send(dbResponse.rows);
});

apiRoute.delete('/deleteDeck', async (req, res) => {
    // authenticate & authorize via JWT
    const authInfo = validateUser(req.cookies["auth"]);

    // If we are not validated, return a 401 error
    if (!authInfo.ok) {
        // unauthenticated
        return res.status(401).send();
    }
    const dbResponse = await db.deleteDeck(authInfo.data.user, req.body.deckID); //TODO: Database function to delete based on deckID VALIDATE THE USER IS THE RIGHT ONE
    if (!dbResponse.ok) {
        return res.status(400).send({ error: dbResponse.error, data: dbResponse.rows });
    }
    res.status(202).send(dbResponse.rows);
});

export default apiRoute;