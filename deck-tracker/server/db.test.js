import { db } from "./database.js";

let testObj = {
    name: 'Bob Hill',
    set: 'Zendikar',
    colors: 9,
    cmc: 5,
    data: '{"stuff":"Things"}'
};

let testObj2 = {
    email: 'bob@thing.com',
    password: '1234',
    username: 'bobbyhill'
}

let checkTest1 = db.checkTypes(db.CARDS, testObj);
let checkTest2 = db.checkTypes(db.USERS, testObj2);

console.assert(!checkTest1.ok, 'card query is ok when it should be not ok');
console.assert(checkTest1.missing.hasOwnProperty('rarity'), 'missing is not returning "rarity"');
console.assert(checkTest1.missing.hasOwnProperty('default'), 'missing is not returning "default"');
console.assert(checkTest1.invalid.hasOwnProperty('colors'), 'invalid is not returning "colors"');
console.assert(checkTest2.ok, 'user query is not ok');