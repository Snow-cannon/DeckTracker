import express from 'express';
import jwtSigner from 'jsonwebtoken';
const { sign, verify } = jwtSigner;
import cookieParser from 'cookie-parser';
import * as db from './database.js';
import * as crypto from 'crypto';
import { db } from './database.js'

const apiRoute = express.Router();

apiRoute.use(express.urlencoded({ extended: true }));
apiRoute.use(express.json());
apiRoute.use(cookieParser());

const SUPER_SECRET = process.env.JWT_SECRET || '8253c11f1244dd66854a126f537d68c350527cebb5678da5c05410e51ddbe32587a3464be4867aa5367f7b4bd4f23fd795ab61b0eed63a30e5f47c73384f222e';

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
                error: true,
            });
        }
        return ({
            error: false,
            data: tokenDecodedData
        });
    } catch (error) {
        return ({
            error: true,
            //data: error
        });
    }
}

// Add a new User
apiRoute.put('/users/newUser', async (req, res) => {
    let options = req.body;
    const e = options.email;
    const pass = await hash(options.password);
    const userName = options.username;

    const result = await db.createNewUser(e, pass, userName); //TODO: Create this function in the database
    if (result) {
        const signedJWT = sign({ user: result }, SUPER_SECRET, { expiresIn: '1 day' });
        res.cookie('auth', signedJWT, { maxAge: 43200000 });
        res.status(201).send();
    }
    else {
        return res.status(401).send();
    }
});


app.post('/login/passwd', async (req, res) => {
    const options = req.body;
    let user = await db.getUserFromEmail(options.email);//TODO: Create function in database
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

export default apiRoute;