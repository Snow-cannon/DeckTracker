//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';
import { _read } from './fileIO.js';

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

    //For table references
    get USERS() { return 'user'; }
    get DECKS() { return 'deck'; }
    get COLLECTION() { return 'collection'; }
    get CONTENT() { return 'content'; }
    get CARDS() { return 'card'; }
    get INSERT() { return 'insert'; }
    get SELECT() { return 'select'; }
    get UPDATE() { return 'update'; }
    get DELETE() { return 'delete'; }

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
            setname: 'string',
            colors: 'string',
            cmc: 'number',
            rarity: 'string',
            defaultcard: 'boolean',
            bulk: 'object'
        });

        this.deckContentTable.setTypes({
            did: 'string',
            cardname: 'string',
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
     * 
     * Query Making Scripts
     * 
     * 
    */

    //Get the table from a string
    getTable(table) {
        let tableObj = {
            card: this.cardTable,
            content: this.deckContentTable,
            collection: this.collectionTable,
            user: this.userTable,
            deck: this.deckTable
        }
        return tableObj[table] || this.dudTable;
    }

    getQueryType(type) {
        if ([this.DELETE, this.INSERT, this.SELECT, this.UPDATE].includes(type)) {
            return { type: type, ok: true };
        } else {
            return { ok: false, error: 'Invalid type' }
        }
    }

    /**
     * 
     * Specific Query Functions
     * 
     */

    async createNewUser(email, pass) {
        let query = this.purifyQuery(this.USERS, { email: email, password: pass });
        if (query.ok) {
            let queryString = `INSERT INTO Users (email, password) VALUES ($1, $2) Returning *;`;
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

    /**
     * 
     * 
     * BUILD QUERY STRINGS
     * 
     * 
     */

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

        //Get the table
        let realTable = this.getTable(table);

        //Get the types object
        let types = realTable.types;

        //Make sure the table is ok
        if (realTable.ok) {
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
                ok: Object.keys(valid).length === Object.keys(realTable.types).length
            };
        } else {
            //Return an error if the table is invalid
            return { ok: false, error: 'Invalid table' };
        }
    }

    layoutQueryValueArray(table, query) {
        //Get the table object
        let realTable = this.getTable(table);

        //Determine that the table is valid
        if (realTable.ok) {

            //Force the values from the query object to be in the correct column order
            return realTable.cols.reduce((p, c) => {
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
        let trueTable = this.getTable(table);
        if (!trueTable.ok) {
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
            values: data.values,
            name: trueTable.name,
            missing: typedQuery.missing,
            invalid: typedQuery.invalid,
            ok: true
        };
    }

}

const db = new Database(process.env.DATABASE_URL);

export { db }