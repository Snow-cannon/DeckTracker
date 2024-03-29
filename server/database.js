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

    /**
     * Connects this object to the specified DB
     */
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

    /**
     * Initializes the database with data
     */
    async init() {
        let sql = await _read('server/initdb.sql');
        await this.client.query(sql);
    }

    /**
     * Disconnects this object from the database
     */
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
        //Wrap database function in a try/catch to get errors
        try {
            //Return the result on successful query
            const res = await this.client.query(queryString, values);
            return res.rows;
        } catch (e) {
            //Run the error script on a database error
            if (typeof error === 'function') {
                error(e);
            } else {
                //Log if there is no error function in development
                // console.log(e, '\n');
            }

            //Return undefined if there is an error
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
        //Check if the user exists
        let queryString = 'SELECT * FROM Users WHERE email=$1;'
        const exists = await this.runQuery(queryString, [email]);

        //If the user already exists, return undefined
        if ((exists && exists.length) || !exists) {
            return undefined;
        }

        //If the user does not exist, create it
        queryString = `INSERT INTO Users (email, password) VALUES ($1, $2) Returning *;`;
        const res = await this.runQuery(queryString, [email, pass]);

        //Return the user data if it exists, undefined otherwise
        return res && res.length ? res[0] : undefined;
    }

    async deleteUser(email) {
        //Check if the user exists
        let queryString = 'SELECT email FROM Users WHERE email=$1;';
        const exists = await this.runQuery(queryString, [email]);
        if (exists) {
            //delete the users collection
            let queryString = 'DELETE FROM Collections WHERE email=$1 RETURNING *;';
            const collection = await this.runQuery(queryString, [email]);
            if (collection) {
                //Delete the deck contents
                let queryString = 'DELETE FROM DeckContent WHERE deckid=ANY(SELECT CAST(deckid AS UUID) FROM Decks WHERE email=$1) RETURNING *;';
                const contents = await this.runQuery(queryString, [email]);
                if (contents) {
                    //Delete the decks attatched to the user
                    queryString = 'DELETE FROM Decks WHERE email=$1 RETURNING *;';
                    const decks = await this.runQuery(queryString, [email]);
                    if (decks) {
                        //Delete the user itself
                        queryString = 'DELETE FROM Users WHERE email=$1 RETURNING *;';
                        return await this.runQuery(queryString, [email]);
                    }
                }
            }
        }

        //Return undefined if there was a problem
        return undefined;
    }

    /**
     * Gets the user information from the email.
     * Returns undefined if unsuccesful
     * 
     * @param {string} email 
     * @returns user data
     */
    async getUserFromEmail(email) {
        //Check if the user exists
        let queryString = `SELECT * FROM Users WHERE email=$1;`;
        const res = await this.runQuery(queryString, [email]);

        //Return the user data if it exists, undefined otherwise
        return res && res.length ? res[0] : undefined;
    }

    /**
     * Imports a deck to the users decklists and returns its deck id
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

        //Create an array to track cards that could not be added
        const skippedCards = [];

        for (const cardname in parsedData) {
            const res = await this.addCard(cardname);
            if (res) {
                //Set the name to the scryfall official name
                correctedData[res.cardname] = parsedData[cardname];
            } else {
                //Skip and add to the invalid list if it is not found
                skippedCards.push(cardname);
            }
        }

        //Generate random deck ID
        const deckid = randomUUID();
        const createDeckQuery = `INSERT INTO Decks (deckid, deckname, email) VALUES ($1, $2, $3);`;
        const res = await this.runQuery(createDeckQuery, [deckid, deckname, email]);

        //Return undefined if the deck could not be created
        if (!res) { return undefined; }

        //Add each card to the deck
        for (const cardname in correctedData) {
            //Get the default card
            const card = await this.getDefaultCard(cardname);

            //Add to the skipped cards array if there is no default card in the db
            if (!card) { skippedCards.push(cardname); }

            //Add the card to the created deck
            const res = await this.addCardToDeck(card.cardname, card.setname, correctedData[cardname], deckid);

            //Push to the skippedCards array if there was a database error
            if (!res) { skippedCards.push(cardname); };
        }

        //Return all the skipped cards and the deck id
        return { skipped: skippedCards, deckid: deckid };
    }

    /**
     * Querys the database and returns an array of deck names and
     * the associated ids that belong to the user
     * 
     * @param {string} email 
     * @returns 
     */
    async getUserDecks(email) {
        let queryString = `SELECT deckname, deckid FROM Decks WHERE email=$1`;
        return await this.runQuery(queryString, [email]);
    }

    /**
     * Returns the contents of the deck as an array of cards and
     * the amount of each card the deck needs
     * 
     * @param {string} deckid 
     * @returns deck contents
     */
    async getDeckContents(deckid, email) {
        let queryString = `SELECT c.cardname, c.img, c.setname, c.colors, c.identity, c.cmc, c.rarity, c.bulk, dc.needed FROM DeckContent AS dc NATURAL JOIN Cards AS c NATURAL JOIN Decks AS d WHERE deckid=CAST($1 AS UUID) AND email=$2`;
        return await this.runQuery(queryString, [deckid, email]);
    }

    /**
     * Adds a card with the specified data to the deck with the specified id.
     * Returns an empty array on success and undefined on an error.
     * 
     * @param {string} cardname 
     * @param {string} setname 
     * @param {number} count 
     * @param {string} deckid 
     * @returns empty array or undefined
     */
    async addCardToDeck(cardname, setname, count, deckid) {
        //Query the database to check that the deck already contains the card
        let queryString = `SELECT needed FROM DeckContent WHERE deckid=CAST($1 AS UUID) AND cardname=$2;`;
        const res = await this.runQuery(queryString, [deckid, cardname]);

        //Return undefined if the result is not valid
        if (!res) { return undefined; }

        //Update the needed value if it exists
        if (res.length > 0) {
            //Increase the amount needed
            let needed = res[0].needed + count;
            queryString = 'UPDATE DeckContent SET needed=$1 WHERE deckid=CAST($2 AS UUID) AND cardname=$3;';
            return await this.runQuery(queryString, [needed, deckid, cardname]);
        } else {
            //Create the card entry and set the amount needed if it dose not yet exist
            queryString = `INSERT INTO DeckContent (deckid, cardname, setname, needed) VALUES ($1, $2, $3, $4);`;
            return await this.runQuery(queryString, [deckid, cardname, setname, count]);
        }
    }

    /**
     * Returns the data from the default card if it exists and undefined
     * if it does not, or if there is a database error.
     * 
     * @param {string} name 
     * @returns default card
     */
    async getDefaultCard(cardname) {
        //Get the card from the database
        let queryString = 'SELECT * FROM Cards WHERE cardname=$1 AND defaultcard=true;';
        const res = await this.runQuery(queryString, [cardname]);

        //Return the card data if it exists or undefined otherwise
        return res && res.length ? res[0] : undefined;
    }

    /**
     * Adds the card to the database.
     * Returns an array of all sets that could not be uploaded
     * and the scryfall cardname
     * 
     * @param {string} cardname 
     * @returns array of skipped cards
     */
    async addCard(cardname) {
        //Get the card data from scryfall
        const cardData = await getCardData(cardname);

        //Return undefined if there is an error getting the data
        if (!cardData) { return undefined; }

        //Get the set information and the cardname
        const cardsBySet = cardData.setData;
        const actualCardName = cardData.cardname;

        //Create an array for skipped values
        const skipped = [];

        //Check if the card is in the database
        for (const setname in cardsBySet) {
            let queryString = 'SELECT cardname, setname FROM Cards WHERE cardname=$1 AND setname=$2';
            const exists = await this.runQuery(queryString, [actualCardName, setname], e => {
                //Push to the skipped array if there is an error
                skipped.push(setname);
                // console.log(e);
            });

            //Don't add to the database if there was an error or the card exists in the database
            if ((exists !== undefined && exists.length > 0) || !exists) { continue; }

            //Insert the card into the database
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
                // console.log(e);
            });
        }

        //Return the sets that got skipped and actual name of the card
        return { skipped: skipped, cardname: actualCardName };
    }

    /**
     * Adds a card to the users collection. Directly
     * sets the value to the specified amount. Returns
     * an empty array on success and undefined on an error
     * 
     * @param {string} email 
     * @param {string} cardname 
     * @param {string} amt 
     * @returns 
     */
    async addToCollection(email, cardname, amt) {
        //Get the card
        const card = await this.getDefaultCard(cardname);

        if (!card) {
            return undefined;
        }

        //See if the card exists
        let queryString = 'SELECT has FROM Collections WHERE cardname=$1 AND email=$2;';
        const exists = await this.runQuery(queryString, [cardname, email]);

        //Add it if it does not exist
        if (exists && !exists.length) {
            queryString = `INSERT INTO Collections (cardname, email, setname, has) VALUES ($1, $2, $3, $4);`;
            return await this.runQuery(queryString, [cardname, email, card.setname, amt]);
        } else { //Update it if it does
            queryString = `UPDATE Collections SET has=$1 WHERE cardname=$2 AND email=$3 AND setname=$4;`;
            return await this.runQuery(queryString, [amt, cardname, email, card.setname]);
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

    /**
     * Delets the deck wuith the specified id
     * from the database. Returns the deck contents
     * on success and undefined on an error.
     * 
     * @param {string} email 
     * @param {string} deckid 
     * @returns 
     */
    async deleteDeck(email, deckid) {
        //Check if the deck exists
        let queryString = 'SELECT deckid FROM Decks WHERE email=$1 AND deckid=CAST($2 AS UUID);';
        const exists = await this.runQuery(queryString, [email, deckid]);
        if (exists && exists.length) {
            //If it exists, delete all cards from the deckContents table
            queryString = 'DELETE FROM DeckContent WHERE deckid=CAST($1 AS UUID) RETURNING cardname, needed;'
            const contents = await this.runQuery(queryString, [deckid]);
            if (contents) {
                //If successful, delete the deck itself
                queryString = 'DELETE FROM Decks WHERE deckid=CAST($1 AS UUID) RETURNING *;'
                return await this.runQuery(queryString, [deckid]);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

}

const db = new Database(process.env.DATABASE_URL);

export { db };