import express from 'express';
import { db } from './database.js';
import apiRoute from './apiRouter.js';
import { expressjwt as jwt } from "express-jwt";
import cookieParser from 'cookie-parser';
import { SUPER_SECRET } from './apiRouter.js';

//Create express application
const app = express();
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


//Statically serve client files
app.use('/', express.static('build'));

await db.connect();

app.use('/api', apiRoute);

app.use(jwt({
    secret: SUPER_SECRET,
    algorithms: ['HS256'],
    getToken: function fromHeaderOrCookie(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.auth) {
            return req.cookies.auth;
        }
        return null;
    }
}).unless({ path: ['/api/users/login', '/api/users/signup'] }));

//Match invalid server requests
app.all('*', async (request, response) => {
    response.status(404).send(`Not found: ${request.path}`);
});


//listen
app.listen(port, () => { console.log(`Server started on port ${port}`) });