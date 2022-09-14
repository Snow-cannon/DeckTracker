import express from 'express';
import { db } from './database.js';
import dbRoute from './db.route.js';

//Create express application
const app = express();
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Statically serve client files
app.use('/', express.static('build'));

await db.connect();

app.use('/db', dbRoute);

//Match invalid server requests
app.all('*', async (request, response) => {
    response.status(404).send(`Not found: ${request.path}`);
});

//listen
app.listen(port, () => { console.log(`Server started on port ${port}`) });