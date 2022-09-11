//Import dotenv for database connections
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

class Database {

    constructor(dburl) {
        this.dburl = dburl;
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

        await this.client.query(cardTable);
        await this.client.query(userTable);
        await this.client.query(deckTable);
        await this.client.query(collectionTable);
        await this.client.query(deckContentTable);

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

}

const database = new Database(process.env.DATABASE_URL);

export { database }