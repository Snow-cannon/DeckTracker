import axios from 'axios';
import scryfall from "scryfall-client";

/**
 * Querys the scryfall datahbase for the named card and all
 * sets it is in. Returns undefined on an error
 * 
 * @param {string} cardName 
 * @returns card data object
 */
export async function getCardData(cardName) {
    try {
        //Get card name from scryfall
        const card = await scryfall.getCardNamed(cardName);

        //Set the default set from the card based on the scryfall default
        const defSet = card.set_name;

        //Get the data from all sets the card is in
        const sets = await axios.get(card.prints_search_uri);

        //Sort by collectors number to get the 'boring' version (Only need one version per set)
        sets.data.data.sort((a, b) => { return a.collector_number - b.collector_number });

        //Create the set data
        const setData = [];
        for (const v of sets.data.data) {
            //Get the name of the current set
            let setName = v.set_name;

            //Only add the data if there is no other version from the set
            if (!setData[setName]) {
                //Get the extranious data
                const bulk = { ...v };

                //Remove the important data from the bulk
                delete bulk.cmc;
                delete bulk.rarity;
                delete bulk.colors;
                delete bulk.identity;
                delete bulk.image_uris;
                delete bulk.name;

                //Create an export object with all important card data
                setData[setName] = {
                    cmc: v.cmc, //CMC
                    rarity: v.rarity, //Rarity
                    colors: v.colors.join(''), //String of the cards colors
                    identity: v.color_identity.join(''), //Commander Identity
                    img: JSON.stringify(v.image_uris), //All images related to the card
                    bulk: JSON.stringify(bulk), //Extra bulk data
                    defaultcard: defSet === setName //Sets to default if it is the default set from scryfall
                };
            }
        }

        //Return the set data
        //Retrurn the cardname separately for easy access
        return { setData: setData, cardname: card.name };
    } catch (e) {
        //Return undefined if there is an error
        return undefined;
    }
}