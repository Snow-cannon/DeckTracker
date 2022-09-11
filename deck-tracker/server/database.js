//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

class Database {

    constructor(dburl) {
        this.dburl = dburl;

        this.emptyTable = () => { return { types: {}, cols: [], name: '', ok: false } };

        this.deckTable = this.emptyTable();
        this.cardTable = this.emptyTable();
        this.collectionTable = this.emptyTable();
        this.deckContentTable = this.emptyTable();
        this.userTable = this.emptyTable();

        this.USERS = 'user';
        this.DECKS = 'deck';
        this.COLLECTION = 'collection';
        this.CONTENT = 'content';
        this.CARDS = 'card';
    }

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
        let missing = {};
        let invalid = {};
        let valid = {};
        let realTable = this.getTable(table);
        let types = realTable.types;
        if (realTable.ok) {
            for (const key in realTable) {
                if (!query.hasOwnProperty(key)) {
                    missing[key] = realTable[key];
                } else if (typeof query[key] !== realTable[key]) {
                    invalid[key] = query[key];
                } else {
                    valid[key] = query[key];
                }
            }
            return {
                missing: missing,
                missingCount: Object.keys(missing).length,
                invalid: invalid,
                invalidCount: Object.keys(invalid).length,
                valid: valid,
                validCount: Object.keys(valid).length,
                toString: function () {
                    let invalid = `${this.invalidCount ? `invalid: ${Object.keys(this.invalid).join(', ')}` : ''}`;
                    let missing = `\n${this.missingCount ? `missing: ${Object.keys(this.missing).join(', ')}` : ''}`;
                    let valid = `\n${this.valid ? `valid  : ${Object.keys(this.valid).join(', ')}` : ''}`;
                    return invalid + missing + valid;
                },
                ok: Object.keys(valid).length === Object.keys(realTable).length
            };
        } else {
            return { ok: false, error: 'Invalid table' };
        }
    }

    layoutQueryValueArray(table, query) {
        let realTable = this.getTable(table);
        if (realTable.ok) {
            return realTable.cols.map(c => {
                if (query.hasOwnProperty(c)) {
                    return query[c];
                } else {
                    return undefined;
                }
            }).filter(c => c !== undefined);
        } else {
            return { ok: false, error: `table ${table} does not exist` }
        }
    }

}

const db = new Database(process.env.DATABASE_URL);
await db.init();

export { db }