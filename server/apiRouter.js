import express from 'express';
import jwtSigner from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { db } from './database.js';
import * as crypto from 'crypto';
const { sign, verify } = jwtSigner;

const apiRoute = express.Router();

apiRoute.use(express.urlencoded({ extended: true }));
apiRoute.use(express.json());
apiRoute.use(cookieParser());

export const SUPER_SECRET = process.env.JWT_SECRET || '8253c11f1244dd66854a126f537d68c350527cebb5678da5c05410e51ddbe32587a3464be4867aa5367f7b4bd4f23fd795ab61b0eed63a30e5f47c73384f222e';

/**
 * Takes in a password and hashes it into a secure password for the server to save
 * 
 * @param {string} password 
 * @returns hashed password
 */
async function hash(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(8).toString("hex")

        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'))
        });
    })
}

/**
 * Verifies that the password is equivilant to it's unhashed version
 * 
 * @param {string} password 
 * @param {string} hash 
 * @returns Promise: boolean
 */
async function verifyPass(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":")
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key == derivedKey.toString('hex'))
        });
    })
}

/**
 * Takes in a cookie and validates the cookie
 * 
 * @param {string} token 
 * @returns boolean and data if valid
 */
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

/**
 * Authenticates users and returns the email
 * if successful. Sends the proper response
 * code on failure.
 * 
 * @param {string[]} skip 
 */
function authorize(skip) {
    return async (req, res, next) => {
        if (skip.includes(req.path)) {
            next();
        } else {
            try {
                // authenticate & authorize via JWT
                const authInfo = validateUser(req.cookies["auth"]);
                if (!authInfo.ok) {
                    return res.status(401).send();
                }

                //Check that the user is valid
                let user = await db.getUserFromEmail(authInfo.data.user);
                if (user === undefined) {
                    res.status(400).send('Email not found');
                } else {
                    //Pass the email through
                    res.locals['email'] = authInfo.data.user;
                    next();
                }
            } catch (e) {
                res.status(500).send();
            }
        }
    }
}

//Do not protect teh users loggin in or signing up
apiRoute.use(authorize(['/users/login', '/users/signup']));

/**
 * 
 * User signup / login
 * NOT PROTECTED
 * 
 */

// Adds a new User
apiRoute.put('/users/signup', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            //No response on bad email/password
            return res.status(400).send('Missing email or password');
        }
        const e = email;
        const pass = await hash(password);

        const user = await db.createNewUser(e, pass);
        if (user) {
            const signedJWT = sign({ user: user.email }, SUPER_SECRET, { expiresIn: '1 day' });
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
        let { email, password } = req.body;
        if (!email || !password) {
            //No response on bad email/password
            return res.status(400).send('Missing email or password');
        }
        let user = await db.getUserFromEmail(email);
        if (user !== undefined && await verifyPass(password, user.password)) {
            const signedJWT = sign({ user: user.email }, SUPER_SECRET, { expiresIn: '1 day' });
            res.cookie('auth', signedJWT, { maxAge: 43200000 });
            res.status(202).send();
        } else {
            if (user === undefined) {
                res.status(401).send('Email not found');
            } else {
                res.status(401).send('Password not validated');
            }
        }
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
});

/**
 * 
 * User data
 * PROTECTED
 * 
 */

//Returns the users email in the cookie if valid
apiRoute.get('/users/data', async (req, res) => {
    try {
        res.status(200).send({ email: res.locals.email });
    } catch (e) {
        res.status(500).send();
    }
});

// Deletes a User
apiRoute.delete('/users/data', async (req, res) => {
    try {
        const body = req.body;
        if (typeof body.password !== 'string') {
            return res.status(400).send('No provided password');
        }

        //Check that the user is valid
        let user = await db.getUserFromEmail(res.locals.email);
        if (user !== undefined && await verifyPass(body.password, user.password)) {
            let deleteResult = await db.deleteUser(res.locals.email);
            res.status(200).send();
        } else {
            if (user === undefined) {
                res.status(400).send('Email not found');
            } else {
                res.status(401).send('Password not validated');
            }
        }
    } catch (e) {
        res.status(500).send();
    }
});

/**
 * 
 * User decklists
 * PROTECTED
 * 
 */

//Importing deck list
apiRoute.put('/users/decks', async (req, res) => {
    try {
        const body = req.body;
        if (!body.deckname) {
            return res.status(400).send('No provided deck name');
        } else if(!body.hasOwnProperty('deckcontent')) {
            return res.status(400).send('No provided deck content');
        }
        let dbResponse = await db.importDeck(res.locals.email, body.deckcontent, body.deckname);
        if (!dbResponse) {
            return res.status(422).send();
        }
        res.status(201).send({ deckid: dbResponse.deckid, unprocessed: dbResponse.skipped });
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

//Delete a specific deck
apiRoute.delete('/users/decks', async (req, res) => {
    const body = req.body;
    if(!body.deckid){
        res.status(400).send('No deck id');
    }
    try {
        const dbResponse = await db.deleteDeck(res.locals.email, req.body.deckid);
        if (!dbResponse) {
            return res.status(400).send();
        }
        res.status(200).send();
    } catch (e) {
        res.status(500).send();
    }
});

//Get a users decks
apiRoute.get('/users/decks', async (req, res) => {
    try {
        const dbResponse = await db.getUserDecks(res.locals.email);
        if (!dbResponse) {
            return res.status(500).send();
        }
        return res.status(200).send({ decks: dbResponse });
    } catch (e) {
        res.status(500).send();
    }
});

//Returns the contents of a specific deck
apiRoute.post('/users/decks/content', async (req, res) => {
    try {
        const body = req.body;
        if(!body.deckid){
            return res.status(400).send('No provided deck id');
        }
        const dbResponse = await db.getDeckContents(body.deckid, res.locals.email);
        if (!dbResponse) {
            return res.status(400).send();
        }
        return res.status(202).send({ contents: dbResponse });
    } catch (e) {
        res.status(500).send();
    }
});

/**
 * 
 * User collections
 * PROTECTED
 * 
 */

//Get all cards in a users collection
apiRoute.get('/users/collection', async (req, res) => {
    try {
        const dbResponse = await db.getUserCollection(res.locals.email);
        if (!dbResponse) {
            return res.status(500).send();
        }
        res.status(200).send({ collection: dbResponse });
    } catch (e) {
        res.status(500).send();
    }
});

//Update a users collection
apiRoute.patch('/users/collection', async (req, res) => {
    try {
        const body = req.body;
        if(!body.cardname){
            return res.status(400).send('Missing card name');
        } else if(!body.totalamount || isNaN(body.totalamount) || body.totalamount < 0 || typeof body.totalamount !== 'number') {
            return res.status(400).send('Missing amount');
        }
        const dbResponse = await db.addToCollection(res.locals.email, req.body.cardname, req.body.totalamount);
        if (!dbResponse) {
            return res.status(400).send();
        }
        res.status(201).send();
    } catch (e) {
        res.status(500).send();
    }
});


export default apiRoute;