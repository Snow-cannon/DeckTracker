//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

class Database {

    constructor(dburl) {
        //URL for connecting to the DB
        this.dburl = dburl;

        //Definition of an empty table
        this.emptyTable = () => { return { types: {}, cols: [], name: '', ok: false } };

        //Initialize all tables as invalid empty tables
        this.deckTable = this.emptyTable();
        this.cardTable = this.emptyTable();
        this.collectionTable = this.emptyTable();
        this.deckContentTable = this.emptyTable();
        this.userTable = this.emptyTable();

        //Constants for table searching
        this.USERS = 'user';
        this.DECKS = 'deck';
        this.COLLECTION = 'collection';
        this.CONTENT = 'content';
        this.CARDS = 'card';
    }

    //Get the table from a string
    getTable(table) {
        let tableObj = {
            card: this.cardTable,
            content: this.deckContentTable,
            collection: this.collectionTable,
            user: this.userTable,
            deck: this.deckTable
        }
        return tableObj[table] || this.emptyTable();
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

        this.cardTable.types = {
            name: 'string',
            set: 'string',
            colors: 'string',
            cmc: 'number',
            rarity: 'string',
            default: 'boolean',
            data: 'string'
        };
        this.cardTable.cols = ['name', 'set', 'colors', 'cmc', 'rarity', 'default', 'data'];
        this.cardTable.name = 'Cards';
        this.cardTable.ok = true;

        const cardTable = `
            CREATE TABLE IF NOT EXISTS Cards (
                name varchar(200) PRIMARY KEY,
                set varchar(50),
                colors varchar(5),
                cmc int,
                rarity varchar(20),
                default boolean,
                data text
            );
        `;

        this.deckContentTable.types = {
            did: 'string',
            name: 'string',
            needed: 'number'
        };
        this.deckContentTable.cols = ['data', 'name', 'needed'];
        this.deckContentTable.name = 'DeckContent';
        this.deckContentTable.ok = true;

        const deckContentTable = `
            CREATE TABLE IF NOT EXISTS DeckContent (
                did uuid,
                name varchar(200),
                needed int,
                FOREIGN KEY (name) REFERENCES Cards,
                FOREIGN KEY (did) REFERENCES Decks
            );
        `;

        this.deckTable.types = {
            did: 'string',
            name: 'string',
            email: 'string'
        };
        this.deckTable.cols = ['did', 'name', 'email'];
        this.deckTable.name = 'Decks';
        this.deckTable.ok = true;

        const deckTable = `
            CREATE TABLE IF NOT EXISTS Decks (
                did uuid PRIMARY KEY,
                name varchar(100),
                email varchar(320),
                FOREIGN KEY (email) REFERENCES Users
            );
        `;

        this.userTable.types = {
            email: 'string',
            password: 'string',
            username: 'string'
        };
        this.userTable.cols = ['email', 'password', 'username'];
        this.userTable.name = 'Users';
        this.userTable.ok = true;

        const userTable = `
            CREATE TABLE IF NOT EXISTS Users (
                email varchar(320) PRIMARY KEY,
                password varchar(50)
            );
        `;

        this.collectionTable.types = {
            name: 'string',
            email: 'string',
            has: 'number'
        };
        this.collectionTable.cols = ['name', 'email', 'has']
        this.collectionTable.name = 'Collection';
        this.collectionTable.ok = true;

        const collectionTable = `
            CREATE TABLE IF NOT EXISTS Collection (
                name varchar(200) PRIMARY KEY,
                email varchar(320) PRIMARY KEY,
                has int,
                FOREIGN KEY (name) REFERENCES Cards,
                FOREIGN KEY (uid) REFERENCES Users
            );
        `;

        //Commented until DB exists
        // await this.client.query(cardTable);
        // await this.client.query(userTable);
        // await this.client.query(deckTable);
        // await this.client.query(collectionTable);
        // await this.client.query(deckContentTable);

    }

    // Close the pool.
    async close() {
        this.client.release();
        await this.pool.end();
    }

    /**
     * Takes in a query object and adds the card to the database if possible
     * 
     * @param {string} query
     */
    async addCard(query) {
        let valid = this.checkTypes(db.CARDS, query);
        if (valid.ok) {
            let queryString = 'INSERT INTO Cards (name, set, colors, cmc, rarity, bulk) VALUES ($1, $2, $3, $4, $5, $6);';
        } else {
            return { ok: false, error: valid.toString() }
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
                    p.values.push(typeof query[c] === 'string' ? `'${query[c]}'` : query[c]);
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

    /**
     * Takes in a table and a query and converts it to an SQL select 
     * query. If strict mode is active, all entries must be included
     * 
     * @param {string} table 
     * @param {object} query 
     * @param {boolean} strict 
     * @returns {object}
     */
    buildSelectQuery(table, query, strict) {

        let trueTable = this.getTable(table);

        //Get the type-checked query
        let typedQuery = this.checkTypes(table, query);

        //Strict mode forces the query to not miss any values
        if (strict && !typedQuery.ok) {
            return { ok: false, error: typedQuery.toString() }
        }

        //Get column names and their values
        let result = this.layoutQueryValueArray(table, typedQuery.valid);
        if (result.ok) {
            let { cols, values } = result;

            //Create the where clause
            let where = [];
            for (let i = 0; i < cols.length; i++) {
                where.push(`${cols[i]}=$${i+1}`);
            }
            where = where.join(' AND ');

            //Create the select statement
            let select = `SELECT ${cols.join(', ')} FROM ${trueTable.name} WHERE ${where};`;

            return { query: select, queryData: values, ok: true };
        } else {
            return { ok: false, error: result.error }
        }
    }

    /**
     * Takes in a table name and a query object and outputs a
     * valid SQL insert query
     * @param {string} table 
     * @param {object} query
     * @returns {object}
     */
    buildInsertQuery(table, query) {
        //Get the actual table data
        let trueTable = this.getTable(table);

        //Get the type-checked query
        let typedQuery = this.checkTypes(table, query);

        //Insert is always strict
        if (!typedQuery.ok) {
            return { ok: false, error: typedQuery.toString() }
        }

        //Get column names and their values
        let result = this.layoutQueryValueArray(table, typedQuery.valid);
        if (result.ok) {
            let { cols, values } = result;

            //Create the where clause
            let substitutes = [];
            for (let i = 0; i < cols.length; i++) {
                substitutes.push(`$${i+1}`);
            }

            //Create the select statement
            let select = `INSERT INTO ${trueTable.name} (${cols.join(', ')}) VALUES (${substitutes.join(', ')});`;

            return { query: select, queryData: values, ok: true };
        } else {
            return { ok: false, error: result.error }
        }
    }

}

const db = new Database(process.env.DATABASE_URL);
await db.init();

export { db }