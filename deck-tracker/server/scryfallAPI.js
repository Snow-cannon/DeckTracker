import axios from 'axios';
import scryfall from "scryfall-client";

/**
 * Querys the scryfall datahbase for the named card and all
 * sets it is in
 * 
 * @param {string} cardName 
 * @returns card data object
 */
export async function getCardData(cardName) {
    try {
        const card = await scryfall.getCardNamed(cardName);
        const defSet = card.set_name;
        const sets = await axios.get(card.prints_search_uri);
        sets.data.data.sort((a, b) => { return a.collector_number - b.collector_number });
        const setData = {};
        for (const v of sets.data.data) {
            let setName = v.set_name;
            if (!setData[setName]) {
                const bulk = { ...v };
                delete bulk.cmc;
                delete bulk.rarity;
                delete bulk.colors;
                delete bulk.identity;
                delete bulk.image_uris;
                setData[setName] = {
                    cmc: v.cmc,
                    rarity: v.rarity,
                    colors: v.colors.join(''),
                    identity: v.color_identity.join(''),
                    img: JSON.stringify(v.image_uris),
                    bulk: JSON.stringify(bulk),
                    defaultcard: defSet === setName
                };
            }
        }
        return { ok: true, setData: setData };
    } catch (e) {
        return { ok: false };
    }
}