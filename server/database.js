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

        class SQLTable {
            constructor(name) {
                this.name = name;
                this.types = {};
                this.cols = [];
                this.ok = false;
            }

            setTypes(types) {
                this.types = types || {};
                this.cols = Object.keys(this.types);
                this.ok = true;
            }
        }

        //Initialize all tables as invalid empty tables
        this.deckTable = new SQLTable('Decks');
        this.cardTable = new SQLTable('Cards');
        this.collectionTable = new SQLTable('Collections');
        this.deckContentTable = new SQLTable('DeckContent');
        this.userTable = new SQLTable('Users');
        this.dudTable = new SQLTable('');

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

    setTableData() {

        this.cardTable.setTypes({
            cardname: 'string',
            img: 'string',
            setname: 'string',
            colors: 'string',
            identity: 'string',
            cmc: 'number',
            rarity: 'string',
            defaultcard: 'boolean',
            bulk: 'string'
        });

        this.deckContentTable.setTypes({
            did: 'string',
            cardname: 'string',
            setname: 'string',
            needed: 'number'
        });

        //Decks
        this.deckTable.setTypes({
            did: 'string',
            deckname: 'string',
            email: 'string'
        });

        this.userTable.setTypes({
            email: 'string',
            password: 'string'
        });

        this.collectionTable.setTypes({
            cardname: 'string',
            setname: 'string',
            email: 'string',
            has: 'number'
        });

    }

    //Initialize the DB with tables and initialize the table objects
    async init() {
        this.setTableData();
        let sql = await _read('server/initdb.sql');
        await this.client.query(sql);
    }

    // Close the pool.
    async close() {
        this.client.release();
        await this.pool.end();
    }

    /**
     * 
     * Specific Query Functions
     * 
     */

    async createNewUser(email, pass) {
        let query = this.purifyQuery(this.userTable, { email: email, password: pass });
        if (query.ok) {
            let queryString = `INSERT INTO Users (${query.cols.join(', ')}) VALUES (${query.replacers.join(', ')}) Returning *;`;
            try {
                const res = await this.client.query(queryString, query.values);
                return { ok: true, rows: res.rows };
            } catch (e) {
                return { ok: false, error: e };
            }
        } else {
            return { ok: false, error: 'Query not ok' };
        }
    }

    async getUserFromEmail(email) {
        let query = this.purifyQuery(this.userTable, { email: email });
        if (query.cols.includes('email')) {
            let queryString = `SELECT * FROM Users WHERE email=$1;`;
            try {
                const res = await this.client.query(queryString, query.values);
                if (res.rows.length > 0) {
                    return { ok: true, ...res.rows[0] };
                } else {
                    return { ok: false, error: 'User does not exist' }
                }
            } catch (e) {
                return { ok: false, error: e };
            }
        } else {
            return { ok: false, error: 'Query not ok' };
        }
    }

    async importDeck(user, content, deckName) {
        //Get cards
        const parsedData = parseMTGCSV(content);

        //Add cards to the db
        try {
            const correctedData = {};
            for (const name in parsedData) {
                const res = await this.addCard(name);
                if (!res.ok) {
                    return res;
                };
                correctedData[res.cardname] = parsedData[name];
            }

            //Generate random deck ID
            const deckId = randomUUID();

            //Purify the query
            const createDeckPure = this.purifyQuery(this.deckTable, {
                email: user,
                deckname: deckName,
                did: deckId
            }, true);

            // Create the deck
            if (createDeckPure.ok) {
                const createDeckQuery = `INSERT INTO Decks (${createDeckPure.cols.join(', ')}) VALUES (${createDeckPure.replacers.join(', ')});`;
                const res = await this.client.query(createDeckQuery, createDeckPure.values);
            } else {
                return { ok: false, error: 'Create Deck query not ok' };
            }

            //Add each card to the deck in d
            for (const name in correctedData) {
                const cardData = await this.getDefaultCard(name);
                if (!cardData.ok) {
                    return { ok: false, error: `Cannot get card '${name}'` };
                }
                const card = cardData.card;
                const res = await this.addCardToDeck(card.cardname, card.setname, correctedData[name], deckId);
                if (!res.ok) {
                    return res;
                };
            }
            return { ok: true, deckId: deckId };
        } catch (e) {
            return { ok: false, error: e };
        }
    }

    async getUserDecks(user) {
        //Check if the card exists
        try {
            const typeCheck = this.checkTypes(this.deckTable, { email: user });
            if (typeCheck.validCount !== 1) {
                return { ok: false, error: 'Incorrect inputs on getUserDecks' };
            }
            let selectQueryString = `SELECT deckname, did FROM Decks WHERE email=$1`;
            const res = await this.client.query(selectQueryString, [user]);
            return { ok: true, deck: res.rows };
        } catch (e) {
            return { ok: false, error: e };
        }
    }

    //Returns the contents of a specific deck
    async getDeckContents(deckId) {
        //Check if the card exists
        try {
            const typeCheck = this.checkTypes(this.deckContentTable, { did: deckId });
            if (typeCheck.validCount !== 1) {
                return { ok: false, error: 'Incorrect inputs' };
            }
            let selectQueryString = `SELECT * FROM DeckContent NATURAL JOIN Cards WHERE did=$1`;
            const res = await this.client.query(selectQueryString, [deckId]);
            return { ok: true, deck: res.rows };
        } catch (e) {
            return { ok: false, error: e };
        }
    }

    async addCardToDeck(name, set, count, deckId) {
        //Check if the deck has the card
        try {
            //Check if the card exists
            const typeCheck = this.checkTypes(this.deckContentTable, { cardname: name, did: deckId });
            if (typeCheck.validCount !== 2) {
                return { ok: false, error: 'Incorrect inputs' };
            }
            let selectQueryString = `SELECT needed FROM DeckContent WHERE did=$1 AND cardname=$2;`;
            const res = await this.client.query(selectQueryString, [deckId, name]);

            //Update the needed value if it does
            if (res.rows.length > 0) {
                //Query has already been purified, so no need to check again
                let needed = res.rows[0].needed + count;
                const updateQueryString = 'UPDATE DeckContent SET needed=$1 WHERE did=$2 AND cardname=$3;';
                const resUpdate = await this.client.query(updateQueryString, [needed, deckId, name]);
                return { ok: true };
            } else {
                //Add the card to the collection if it does not
                let pureQuery = this.purifyQuery(this.deckContentTable, {
                    cardname: name,
                    did: deckId,
                    setname: set,
                    needed: count
                }, true);
                if (pureQuery.ok) {
                    let queryString = `INSERT INTO DeckContent (${pureQuery.cols.join(', ')}) VALUES (${pureQuery.replacers.join(', ')});`;
                    const res = await this.client.query(queryString, pureQuery.values);
                    return { ok: true };
                } else {
                    return { ok: false, error: 'pureQuery not OK' };
                }
            }
        } catch (e) {
            return { ok: false, error: e };
        }
    }
    /**
     * Returns the data of the default card in the database with the specified name.
     * Returns ok: false if the card does not exist.
     * 
     * @param {string} name 
     * @returns ok, card?, error?
     */
    async getDefaultCard(name) {
        if (typeof name === 'string') {

        }
        let queryString = 'SELECT * FROM Cards WHERE cardname=$1 AND defaultcard=true;';
        try {
            const res = await this.client.query(queryString, [name]);
            if (res.rows.length > 0) {
                return { ok: true, card: res.rows[0] };
            } else {
                return { ok: false, error: 'Card does not exist' };
            }
        } catch (e) {
            return { ok: false, error: 'Database Error' };
        }
    }

    async getCardData() {
        let queryString = 'SELECT cardname, setname FROM Cards;';
        try {
            const res = await this.client.query(queryString, []);
            if (res.rows.length > 0) {
                return { ok: true, cards: res.rows };
            } else {
                return { ok: false, error: 'No cards' };
            }
        } catch (e) {
            return { ok: false, error: 'Database Error' };
        }
    }

    /**
     * Adds a card and all iat's set varients to the database, including the 'default' version.
     * Skips all cards currently in the database
     * @param {string} name 
     * @returns ok, skipped?
     */
    async addCard(name) {
        const cardData = await getCardData(name);
        if (!cardData.ok) {
            return { ok: false, error: `Scryfall cannot find card '${name}'` };
        }

        const cardsBySet = cardData.setData;
        const cardname = cardData.cardname;
        const skipped = [];

        //Check if the card is in the database
        for (const set in cardsBySet) {
            let checkExistsQuery = 'SELECT cardname, setname FROM Cards WHERE cardname=$1 AND setname=$2';
            try {
                const res = await this.client.query(checkExistsQuery, [cardname, set]);
                if (res.rows.length === 1) {
                    continue; //Skip adding the card if it exists
                }
            } catch (e) {
                skipped.push(set);
                continue; //Do not continue if there was a database error
            }

            //Add the card if necesary
            let query = this.purifyQuery(this.cardTable, { ...cardsBySet[set], cardname: cardname, setname: set }, true);
            if (query.ok) {
                let queryString = `INSERT INTO Cards (${query.cols.join(', ')}) VALUES (${query.replacers.join(', ')});`;
                try {
                    const res = await this.client.query(queryString, query.values);
                } catch (e) {
                    skipped.push(set);
                    continue;
                }
            } else {
                skipped.push(set);
                continue;
            }
        }

        //Return not ok if any of the cards were skipped
        if (skipped.length > 0) {
            return { ok: false, skipped: skipped, error: `[${cardname}: ${skipped.join(', ')}] could not be added to the database` };
        } else {
            return { ok: true, cardname: cardname };
        }
    }

    async addToCollection(user, name, amt) {
        const cardData = await this.getDefaultCard(name);
        const card = cardData.card;
        const query = this.purifyQuery(this.collectionTable, {
            cardname: name,
            email: user,
            has: amt,
            setname: card.setname
        });

        //Add cards to the db
        let checkExistsQuery = 'SELECT has FROM Collections WHERE cardname=$1 AND email=$2;';
        try {
            const res = await this.client.query(checkExistsQuery, [name, user]);
            console.log(res.rows)
            if (res.rows.length === 0) {
                let addQuery = `INSERT INTO Collections (${query.cols.join(', ')}) VALUES (${query.replacers.join(', ')});`;
                console.log(addQuery);
                const added = await this.client.query(addQuery, query.values);
                return { ok: true };
            } else {
                let updateQuery = `UPDATE Collections SET has=$1 WHERE cardname=$2 AND email=$3 AND setname=$4;`;
                console.log(updateQuery, [amt, name, user, card.setname]);
                const updated = await this.client.query(updateQuery, [amt, name, user, card.setname]);
                return { ok: true };
            }
        } catch (e) {
            return { ok: false, error: 'Could not add to collection' };
        }
    }

    async getUserCollection(user) {
        if (typeof user === 'string') {
            const queryString = 'SELECT cardname, has FROM Collections WHERE email=$1;'
            try {
                const res = await this.client.query(queryString, [user]);
                return { ok: true, data: res.rows };
            } catch (e) {
                return { ok: false, error: 'Could not get collection' };
            }
        } else {
            return { ok: false, error: 'Invalid email' }
        }
    }

    /**
     * Takes in a table object and compares the types to the input object.
     * Options: user, deck, card, collection, deckContent
     * 
     * @param {string} table
     * @param {object} query
     */
    checkTypes(table, query) {
        //Create storage objs
        let missing = {};
        let invalid = {};
        let valid = {};

        //Get the types object
        let types = table.types;

        //Make sure the table is ok
        if (table.ok) {
            //Check every type in the query obj
            for (const key in types) {
                //If the key does not exist in the query, add it to missing
                if (!query.hasOwnProperty(key)) {
                    missing[key] = types[key];
                    //If the key exists but is not the right type, add it to invalid
                } else if (typeof query[key] !== types[key]) {
                    invalid[key] = query[key];
                    //If it exists and is the right type, add it to valid
                } else {
                    valid[key] = query[key];
                }
            }

            //Return an object with the missing, invalid, and valid data
            return {
                missing: missing,
                missingCount: Object.keys(missing).length,
                invalid: invalid,
                invalidCount: Object.keys(invalid).length,
                valid: valid,
                validCount: Object.keys(valid).length,
                //Add a toString function for logging data
                toString: function () {
                    let invalid = `${this.invalidCount ? `invalid: ${Object.keys(this.invalid).join(', ')}` : ''}`;
                    let missing = `\n${this.missingCount ? `missing: ${Object.keys(this.missing).join(', ')}` : ''}`;
                    let valid = `\n${this.valid ? `valid  : ${Object.keys(this.valid).join(', ')}` : ''}`;
                    return invalid + missing + valid;
                },
                //Return not ok if the number of valid keys is niot the same as the number of input keys
                ok: Object.keys(valid).length === Object.keys(table.types).length
            };
        } else {
            //Return an error if the table is invalid
            return { ok: false, error: 'Invalid table' };
        }
    }

    layoutQueryValueArray(table, query) {
        //Determine that the table is valid
        if (table.ok) {

            //Force the values from the query object to be in the correct column order
            return table.cols.reduce((p, c) => {
                //Only add values that exist in the query
                if (query.hasOwnProperty(c)) {
                    p.cols.push(c);
                    p.values.push(typeof query[c] === 'string' ? `${query[c]}` : query[c]);
                    return p;
                } else {
                    return p;
                }
            }, { cols: [], values: [], ok: true });
        } else {
            //Return an error if the table is not ok
            return { ok: false, error: `table ${table} does not exist` }
        }
    }

    purifyQuery(table, query, strict) {
        if (!table.ok) {
            return { ok: false, error: 'Table does not exist' };
        }
        let typedQuery = this.checkTypes(table, query);
        if (strict && !typedQuery.ok) {
            return {
                ok: false,
                error: typedQuery.toString(),
                missing: typedQuery.missing,
                invalid: typedQuery.invalid
            }
        }
        let data = this.layoutQueryValueArray(table, typedQuery.valid);
        return {
            cols: data.cols,
            replacers: data.cols.map((x, i) => `$${i + 1}`),
            values: data.values,
            name: table.name,
            missing: typedQuery.missing,
            invalid: typedQuery.invalid,
            ok: true
        };
    }

}

const db = new Database(process.env.DATABASE_URL);

export { db }