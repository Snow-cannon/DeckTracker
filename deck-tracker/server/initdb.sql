CREATE TABLE IF NOT EXISTS Cards (
    cardname varchar(200) PRIMARY KEY,
    setname varchar(50),
    colors varchar(5),
    cmc int,
    rarity varchar(20),
    defaultcard boolean,
    bulk text
);

CREATE TABLE IF NOT EXISTS Users (
    email varchar(320),
    password varchar(50),
    username varchar(50),
    PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS Decks (
    did UUID PRIMARY KEY,
    deckname varchar(100),
    email varchar(320),
    FOREIGN KEY (email) REFERENCES Users
);

CREATE TABLE IF NOT EXISTS DeckContent (
    did UUID,
    cardname varchar(200),
    needed int,
    FOREIGN KEY (cardname) REFERENCES Cards,
    FOREIGN KEY (did) REFERENCES Decks,
    PRIMARY KEY (did, cardname)
);

CREATE TABLE IF NOT EXISTS Collections (
    cardname varchar(200),
    email varchar(320),
    has int,
    FOREIGN KEY (cardname) REFERENCES Cards,
    FOREIGN KEY (email) REFERENCES Users,
    PRIMARY KEY (cardname, email)
);