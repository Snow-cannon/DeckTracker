import { db } from "./database.js";
import { Tester } from "./testHelper.js";

let T = new Tester();
T.init({ passed: true, failed: true });
// T.init({ passed: false, failed: true });
// T.init({ passed: true, failed: false });
// T.init({ passed: false, failed: false });

//getTable

let table1 = db.getTable(db.CARDS);
let table2 = db.getTable('fail');

T.group('getTable');
T.test(table1.hasOwnProperty('types'), 'Cards has property "types"', 'Cards table does not have property "types"');
T.test(table1.hasOwnProperty('cols'), 'Cards has property "cols"', 'Cards table does not have property "cols"');
T.test(table1.hasOwnProperty('name'), 'Cards has property "name"', 'Cards table does not have property "name"');
T.test(table1.hasOwnProperty('ok'), 'Cards has property "ok"', 'Cards table does not have property "ok"');
T.test(Object.keys(table1.types).length === 7, 'Cards table has 7 types', 'Card table does not have 7 types');
T.test(table1['cols'].length === 7, 'Cards table has 7 cols', 'Card table does not have 7 cols');
T.test(table1['name'] === 'Cards', 'Cards table has name "Cards"', 'Card table name is not "Cards"');
T.test(table1['ok'], 'Cards table is ok"', 'Card table is not ok');

T.test(table2.hasOwnProperty('types'), 'Invalid table has property "types"', 'Invalid table does not have property "types"');
T.test(table2.hasOwnProperty('cols'), 'Invalid table has property "cols"', 'Invalid table does not have property "cols"');
T.test(table2.hasOwnProperty('name'), 'Invalid table has property "name"', 'Invalid table does not have property "name"');
T.test(table2.hasOwnProperty('ok'), 'Invalid table has property "ok"', 'Invalid table does not have property "ok"');
T.test(Object.keys(table2.types).length === 0, 'Invalid table has no type cols', 'Invalid table has more than 0 types');
T.test(table2['cols'].length === 0, 'Invalid table has no named cols', 'Invalid table has more than 0 cols');
T.test(table2['name'] === '', 'Invalid table has no name', 'Invalid table has a non-empty name');
T.test(!table2['ok'], 'Invalid table is not ok', 'Invalid table should not be ok');

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

T.group('checkTypes');
T.test(checkTest1.hasOwnProperty('missing'), 'Check type has field "missing"', 'CheckTypes does not have field "missing"');
T.test(checkTest1.hasOwnProperty('missingCount'), 'Check type has field "missingCount"', 'CheckTypes does not have field "missingCount"');
T.test(checkTest1.hasOwnProperty('invalid'), 'Check type has field "invalid"', 'CheckTypes does not have field "invalid"');
T.test(checkTest1.hasOwnProperty('invalidCount'), 'Check type has field "invalidCount"', 'CheckTypes does not have field "invalidCount"');
T.test(checkTest1.hasOwnProperty('valid'), 'Check type has field "valid"', 'CheckTypes does not have field "valid"');
T.test(checkTest1.hasOwnProperty('validCount'), 'Check type has field "validCount"', 'CheckTypes does not have field "validCount"');
T.test(checkTest1.hasOwnProperty('toString'), 'Check type has field "toString"', 'CheckTypes does not have field "toString"');
T.test(checkTest1.hasOwnProperty('ok'), 'Check type has field "ok"', 'CheckTypes does not have field "ok"');
T.test(!checkTest1.ok, 'Query is not ok with invalid/missing returns', 'Card query is ok when it should be not ok');
T.test(checkTest1.missing.hasOwnProperty('rarity'), 'Missing field has property "rarity"', 'Missing is not returning "rarity"');
T.test(checkTest1.missing.hasOwnProperty('default'), 'Missing field has property "default"', 'Missing is not returning "default"');
T.test(checkTest1.invalid.hasOwnProperty('colors'), 'Invalid field has property "colors"', 'Invalid is not returning "colors"');
T.test(checkTest1.valid.hasOwnProperty('cmc'), 'Valid field has property "cmc"', 'Valid does not have key "cmc"');
T.test(checkTest1.valid.hasOwnProperty('set'), 'Valid field has property "set"', 'Valid does not have key "set"');
T.test(checkTest1.valid.hasOwnProperty('name'), 'Valid field has property "name"', 'Valid does not have key "name"');
T.test(checkTest1.valid.hasOwnProperty('data'), 'Valid field has property "data"', 'Valid does not have key "data"');
T.test(checkTest1.validCount === 4, 'ValidCount is 4', 'Valid does not have key "data"');
T.test(checkTest1.invalidCount === 1, 'InvalidCount is 1', 'Invalid count does not equal 1');
T.test(checkTest1.missingCount === 2, 'MissingCount is 2', 'Missing count does not equal 2');
T.test(checkTest2.ok, 'Perfect query is ok', 'User query is not ok');
T.test(!checkTest3.ok, 'Imperfect query is not ok', 'Should return "not ok"');
T.test(checkTest3.hasOwnProperty('error'), 'imperfect query has an error message', 'Should return an error');

//LayoutQueryValueArray(table, obj)

let layout1 = db.layoutQueryValueArray(db.CARDS, checkTest1.valid);

T.group('layoutQueryValueArray');
T.test(layout1.values[0] === 'Bob Hill', 'First values element is "Bob Hill"', 'First values element is not "Bob Hill"');
T.test(layout1.values[1] === 'Zendikar', 'Second values element is "Zendikar"', 'Second element is not "Zendikar"');
T.test(layout1.values[2] === 5, 'Third values element is "5"', 'Third values element is not "5"');
T.test(layout1.values[3] === '{"stuff":"Things"}', 'Fourth values element is "{"stuff":"Things"}"', 'Fourth values element is not the "{"stuff":"Things"}"');
T.test(layout1.values.length === 4, 'Length of values is 4', 'Length of values is not 4');
T.test(layout1.cols[0] === 'name', 'First cols element is "name"', 'First cols element is not the name');
T.test(layout1.cols[1] === 'set', 'Second cols element is "set"', 'Second cols element is not the set');
T.test(layout1.cols[2] === 'cmc', 'Third cols element is "cmc"', 'Third cols element is not the cmc');
T.test(layout1.cols[3] === 'data', 'Fourth cols element is "data"', 'Fourth cols element is not the data');
T.test(layout1.values.length === 4, 'Length of cols is 4', 'Length of cols is not 4');

T.skip('getTable');
T.skip('checkTypes');
T.skip('layoutQueryValueArray');

T.log();