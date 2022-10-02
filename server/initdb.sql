CREATE TABLE IF NOT EXISTS Cards (
    cardname varchar(200),
    img text,
    setname varchar(50),
    colors varchar(5),
    identity varchar(5),
    cmc int,
    rarity varchar(20),
    defaultcard boolean,
    bulk text,
    PRIMARY KEY (cardname, setname)
);

CREATE TABLE IF NOT EXISTS Users (
    email varchar(320) NOT NULL,
    password varchar(450) NOT NULL,
    PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS Decks (
    deckid UUID PRIMARY KEY,
    deckname varchar(100),
    email varchar(320),
    FOREIGN KEY (email) REFERENCES Users
);

CREATE TABLE IF NOT EXISTS DeckContent (
    deckid UUID,
    cardname varchar(200),
    setname varchar(50),
    needed int,
    FOREIGN KEY (cardname, setname) REFERENCES Cards,
    FOREIGN KEY (deckid) REFERENCES Decks,
    PRIMARY KEY (deckid, cardname)
);

CREATE TABLE IF NOT EXISTS Collections (
    cardname varchar(200),
    email varchar(320),
    setname varchar(50),
    has int,
    FOREIGN KEY (cardname, setname) REFERENCES Cards,
    FOREIGN KEY (email) REFERENCES Users,
    PRIMARY KEY (cardname, email)
);