//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

class Database {

    constructor(dburl) {
        this.dburl = dburl;

        this.cardTableTypes = {};
        this.deckContentTableTypes = {};
        this.collectionTableTypes = {};
        this.userTableTypes = {};
        this.deckTableTypes = {};

        this.USERS = 'user';
        this.DECKS = 'deck';
        this.COLLECTION = 'collection';
        this.CONTENT = 'content';
        this.CARDS = 'card';
    }

    typeTable(table) {
        let typeTables = {
            card: this.cardTableTypes,
            content: this.deckContentTableTypes,
            collection: this.collectionTableTypes,
            user: this.userTableTypes,
            deck: this.deckTableTypes,
        }
        return typeTables[table];
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

        this.cardTableTypes = {
            name: 'string',
            set: 'string',
            colors: 'string',
            cmc: 'number',
            rarity: 'string',
            default: 'boolean',
            data: 'string'
        };

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

        this.deckContentTableTypes = {
            did: 'string',
            name: 'string',
            needed: 'number'
        }

        const deckContentTable = `
            CREATE TABLE IF NOT EXISTS DecksContent (
                did uuid,
                name varchar(200),
                needed int,
                FOREIGN KEY (name) REFERENCES Cards,
                FOREIGN KEY (did) REFERENCES Decks
            );
        `;

        this.deckTableTypes = {
            did: 'string',
            name: 'string',
            email: 'string'
        }

        const deckTable = `
            CREATE TABLE IF NOT EXISTS Decks (
                did uuid PRIMARY KEY,
                name varchar(100),
                email varchar(320),
                FOREIGN KEY (email) REFERENCES Users
            );
        `;

        this.userTableTypes = {
            email: 'string',
            password: 'string',
            username: 'string'
        }

        const userTable = `
            CREATE TABLE IF NOT EXISTS Users (
                email varchar(320) PRIMARY KEY,
                password varchar(50)
            );
        `;

        this.collectionTableTypes = {
            name: 'string',
            email: 'string',
            has: 'number'
        }

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
     * 
     * @param {string} name 
     * @param {string} set 
     * @param {string[]} colors 
     * @param {number} cmc 
     * @param {string} rarity 
     * @param {object} bulk 
     */
    async addCard(name, set, colors, cmc, rarity, bulk) {
        let query = 'INSERT INTO Cards (name, set, colors, cmc, rarity, bulk) VALUES ($1, $2, $3, $4, $5, $6);';

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
        let types = this.typeTable(table);
        for (const key in types) {
            if (!query.hasOwnProperty(key)) {
                missing[key] = types[key];
            } else if (typeof query[key] !== types[key]) {
                invalid[key] = query[key];
            }
        }
        return { missing: missing, invalid: invalid, ok: Object.keys(invalid).length === 0 && Object.keys(missing).length === 0 };
    }

}

const db = new Database(process.env.DATABASE_URL);
await db.init();

export { db }