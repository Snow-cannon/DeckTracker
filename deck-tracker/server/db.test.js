import { db } from "./database.js";
import { color_string, groupTitle, test } from "./utils.js";

console.log(color_string('\nTesting...\n', 160));

//getTable

let table1 = db.getTable(db.CARDS);
let table2 = db.getTable('fail');

groupTitle('getTable');
test(table1.hasOwnProperty('types'), 'Cards table does not have property "types"');
test(table1.hasOwnProperty('cols'), 'Cards table does not have property "cols"');
test(table1.hasOwnProperty('name'), 'Cards table does not have property "name"');
test(table1.hasOwnProperty('ok'), 'Cards table does not have property "ok"');
test(Object.keys(table1.types).length === 7, 'Card table does not have 7 types');
test(table2['cols'].length === 7, 'Card table does not have 7 cols');
test(table2['name'] === 'Cards', 'Card table name is not "Cards"');
test(table2['ok'], 'Card table is not ok');

test(table2.hasOwnProperty('types'), 'Invalid table does not have property "types"');
test(table2.hasOwnProperty('cols'), 'Invalid table does not have property "cols"');
test(table2.hasOwnProperty('name'), 'Invalid table does not have property "name"');
test(table2.hasOwnProperty('ok'), 'Invalid table does not have property "ok"');
test(Object.keys(table2.types).length === 0, 'Invalid table has more than 0 types');
test(table2['cols'].length === 0, 'Invalid table has more than 0 cols');
test(table2['name'] === '', 'Invalid table has a non-empty name');
test(!table2['ok'], 'Invalid table should not be ok');

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
let checkTest3 = db.checkTypes('fail', testObj2);

//checkTypes(table, obj)

groupTitle('checkTypes');
test(checkTest1.hasOwnProperty('missing'), 'CheckTypes does not have field "missing"');
test(checkTest1.hasOwnProperty('missingCount'), 'CheckTypes does not have field "missingCount"');
test(checkTest1.hasOwnProperty('invalid'), 'CheckTypes does not have field "invalid"');
test(checkTest1.hasOwnProperty('invalidCount'), 'CheckTypes does not have field "invalidCount"');
test(checkTest1.hasOwnProperty('valid'), 'CheckTypes does not have field "valid"');
test(checkTest1.hasOwnProperty('validCount'), 'CheckTypes does not have field "validCount"');
test(checkTest1.hasOwnProperty('toString'), 'CheckTypes does not have field "toString"');
test(checkTest1.hasOwnProperty('ok'), 'CheckTypes does not have field "ok"');
test(!checkTest1.ok, 'Card query is ok when it should be not ok');
test(checkTest1.missing.hasOwnProperty('rarity'), 'Missing is not returning "rarity"');
test(checkTest1.missing.hasOwnProperty('default'), 'Missing is not returning "default"');
test(checkTest1.invalid.hasOwnProperty('colors'), 'Invalid is not returning "colors"');
test(checkTest1.valid.hasOwnProperty('cmc'), 'Valid does not have key "cmc"');
test(checkTest1.valid.hasOwnProperty('set'), 'Valid does not have key "set"');
test(checkTest1.valid.hasOwnProperty('name'), 'Valid does not have key "name"');
test(checkTest1.valid.hasOwnProperty('data'), 'Valid does not have key "data"');
test(checkTest1.validCount === 4, 'Valid does not have key "data"');
test(checkTest1.invalidCount === 1, 'Invalid count does not equal 1');
test(checkTest1.missingCount === 2, 'Missing count does not equal 2');
test(checkTest2.ok, 'User query is not ok');
test(!checkTest3.ok, 'Should return "not ok"');
test(checkTest3.hasOwnProperty('error'), 'Should return an error');

//LayoutQueryValueArray(table, obj)

let layout1 = db.layoutQueryValueArray(db.CARDS, checkTest1.valid);

groupTitle('layoutQueryValueArray');
test(layout1[0] === 'Bob Hill', 'First element is not the name');
test(layout1[1] === 'Zendikar', 'Second element is not the set');
test(layout1[2] === 'mythic', 'Third element is not the cmc');
test(layout1[3] === '{"stuff":"Things"}', 'Fourth element is not the data');
test(layout1.length === 4, "Length is not 4");

console.log(color_string('\nTesting Complete!\n', 160));