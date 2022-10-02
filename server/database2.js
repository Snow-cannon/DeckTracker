//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';
import { _read } from './fileIO.js';
import { parseMTGCSV } from './MTGCSVParse.js';
import { getCardData } from './scryfallAPI.js';
import { randomUUID } from 'crypto';

const { Pool } = pg;

class Database {

    constructor(dburl) {
        //URL for connecting to the DB
        this.dburl = dburl;
    }

    //Connect to the DB
    async connect() {
        this.pool = new Pool({
            connectionString: this.dburl,
            ssl: { rejectUnauthorized: false }, // Required for Heroku connections
        });

        // Create the pool.
        this.client = await this.pool.connect();

        // Init the database.
        await this.init();
    }

    //Initialize the DB with tables and initialize the table objects
    async init() {
        let sql = await _read('server/initdb.sql');
        await this.client.query(sql);
    }

    // Close the pool.
    async close() {
        this.client.release();
        await this.pool.end();
    }

    /**
     * Runs a query on the database and returns the result.
     * Returns undefined if there is an error and logs the error
     * if there is no error handler
     * 
     * @param {string} query 
     * @param {any[]} values 
     * @param {function(string):void} error
     * @returns Results of a database query
     */
    async runQuery(queryString, values, error) {
        try {
            const res = await this.client.query(queryString, values);
            return res.rows;
        } catch (e) {
            //Optional script on error
            if (typeof error === 'function') {
                error(e);
            } else {
                console.log(e, '\n');
            }
            return undefined;
        }
    }

    /**
     * Returns the result of creating a new user.
     * Returns undefined if unsuccessful
     * 
     * @param {string} email 
     * @param {string} pass
     * @returns result of query
     */
    async createNewUser(email, pass) {
        let queryString = `INSERT INTO Users (email, password) VALUES ($1, $2) Returning *;`;
        const res = await this.runQuery(queryString, [email, pass]);
        return res && res.length ? res[0] : res;
    }

    /**
     * Gets the user information from the email.
     * Returns undefined if unsuccesful
     * 
     * @param {string} email 
     * @returns user data
     */
    async getUserFromEmail(email) {
        let queryString = `SELECT * FROM Users WHERE email=$1;`;
        const res = await this.runQuery(queryString, [email]);
        return res && res.length ? res[0] : res;
    }

    /**
     * Imports a deck to the users decklists and returns the deck id
     * 
     * @param {string} email 
     * @param {string} contents 
     * @param {string} deckname 
     * @returns deck id
     */
    async importDeck(email, contents, deckname) {
        //Get card data
        const parsedData = parseMTGCSV(contents);

        //Add the card to the database if needed
        const correctedData = {};
        for (const name in parsedData) {
            const res = await this.addCard(name);
            if (!res) { return undefined };
            correctedData[res.cardname] = parsedData[name];
        }

        //Generate random deck ID
        const did = randomUUID();
        const createDeckQuery = `INSERT INTO Decks (did, deckname, email) VALUES ($1, $2, $3);`;
        const res = await this.runQuery(createDeckQuery, [did, deckname, email]);

        //Add each card to the deck in d
        for (const name in correctedData) {
            console.log(name);
            const card = await this.getDefaultCard(name);
            if (!card) { console.log('noCard'); return undefined; }
            const res = await this.addCardToDeck(card.cardname, card.setname, correctedData[name], did);
            if (!res) { console.log('failed to add'); return undefined; };
        }

        //Return the deck id if it was successful
        if (res === undefined) { return undefined; }
        else { return did; }
    }

    async getUserDecks(email) {
        let queryString = `SELECT deckname, did FROM Decks WHERE email=$1`;
        return await this.runQuery(queryString, [email]);
    }

    //Returns the contents of a specific deck
    async getDeckContents(did) {
        let queryString = `SELECT * FROM DeckContent NATURAL JOIN Cards WHERE did=$1`;
        return await this.runQuery(queryString, [did]);
    }

    async addCardToDeck(cardname, setname, count, did) {
        let queryString = `SELECT needed FROM DeckContent WHERE did=$1 AND cardname=$2;`;
        const res = await this.runQuery(queryString, [did, cardname]);

        //Return undefined if the result is not valid
        if (!res) { return undefined; }

        //Update the needed value if it does
        if (res.length > 0) {
            let needed = res[0].needed + count;
            queryString = 'UPDATE DeckContent SET needed=$1 WHERE did=$2 AND cardname=$3;';
            return await this.runQuery(queryString, [needed, did, cardname]);
        } else {
            queryString = `INSERT INTO DeckContent (did, cardname, setname, needed) VALUES ($1, $2, $3, $4);`;
            return await this.runQuery(queryString, [did, cardname, setname, count]);
        }
    }
    /**
     * Returns the data of the default card in the database with the specified name.
     * Returns ok: false if the card does not exist.
     * 
     * @param {string} name 
     * @returns default card
     */
    async getDefaultCard(cardname) {
        let queryString = 'SELECT * FROM Cards WHERE cardname=$1 AND defaultcard=true;';
        const res = await this.runQuery(queryString, [cardname]);
        return res && res.length ? res[0] : res;
    }

    /**
     * Returns all card data in the database
     * @returns card data
     */
    async getAllCardData() {
        let queryString = 'SELECT cardname, setname FROM Cards;';
        return await this.runQuery(queryString, []);
    }

    /**
     * Adds the card to the database.
     * Returns an array of all sets that could not
     * be uploaded. Empty if successful
     * 
     * @param {string} cardname 
     * @returns array of skipped cards
     */
    async addCard(cardname) {
        const cardData = await getCardData(cardname);
        if (!cardData.ok) { return undefined; }

        const cardsBySet = cardData.setData;
        const actualCardName = cardData.cardname;
        const skipped = [];

        //Check if the card is in the database
        for (const setname in cardsBySet) {
            let queryString = 'SELECT cardname, setname FROM Cards WHERE cardname=$1 AND setname=$2';
            const exists = await this.runQuery(queryString, [actualCardName, setname], e => {
                skipped.push(setname);
                console.log(e);
            });
            //Skip if the card exists in the database
            if (exists !== undefined && exists.length > 0) { continue; }

            const card = cardsBySet[setname];
            queryString = `INSERT INTO Cards (
                cardname,
                setname,
                img,
                colors,
                identity,
                cmc,
                rarity,
                defaultcard,
                bulk
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            );`;
            await this.runQuery(queryString, [
                actualCardName,
                setname,
                card.img,
                card.colors,
                card.identity,
                card.cmc,
                card.rarity,
                card.defaultcard,
                card.bulk
            ], e => {
                skipped.push(setname);
                console.log(e);
            });
        }

        return { skipped: skipped, cardname: actualCardName };
    }

    async addToCollection(email, cardname, amt) {
        //Get the card
        const card = await this.getDefaultCard(cardname);

        //See if the card exists
        let queryString = 'SELECT has FROM Collections WHERE cardname=$1 AND email=$2;';
        const exists = await this.runQuery(queryString, [cardname, email]);

        //Add it if it does not exist
        if (exists && !exists.length) {
            queryString = `INSERT INTO Collections (cardname, email, setname, has) VALUES ($1, $2, $3, $4);`;
            return await this.client.query(queryString, [cardname, email, card.setname, amt]);
        } else { //Update it if it dose
            queryString = `UPDATE Collections SET has=$1 WHERE cardname=$2 AND email=$3 AND setname=$4;`;
            return await this.client.query(queryString, [amt, cardname, email, card.setname]);
        }
    }

    /**
     * Gets the cards in a users collection.
     * 
     * @param {string} email 
     * @returns 
     */
    async getUserCollection(email) {
        const queryString = 'SELECT cardname, has FROM Collections WHERE email=$1;'
        return await this.runQuery(queryString, [email]);
    }

}

const db = new Database(process.env.DATABASE_URL);

export { db };