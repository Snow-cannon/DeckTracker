import { db } from "./database.js";
import { Tester } from "./testHelper.js";

let specified = process.argv[2];

let T = new Tester();
T.init({ passed: true, failed: true });
// T.init({ passed: false, failed: true });
// T.init({ passed: true, failed: false });
// T.init({ passed: false, failed: false });

// T.skip('getTable');
// T.skip('checkTypes');
// T.skip('layoutQueryValueArray');
// T.skip('buildSelectQuery');

//getTable

let testTable1 = db.getTable(db.CARDS);
let testTable2 = db.getTable('fail');

T.group('getTable');
T.test(testTable1.hasOwnProperty('types'), 'Cards has property "types"', 'Cards table does not have property "types"');
T.test(testTable1.hasOwnProperty('cols'), 'Cards has property "cols"', 'Cards table does not have property "cols"');
T.test(testTable1.hasOwnProperty('name'), 'Cards has property "name"', 'Cards table does not have property "name"');
T.test(testTable1.hasOwnProperty('ok'), 'Cards has property "ok"', 'Cards table does not have property "ok"');
T.test(Object.keys(testTable1.types).length === 7, 'Cards table has 7 types', 'Card table does not have 7 types');
T.test(testTable1['cols'].length === 7, 'Cards table has 7 cols', 'Card table does not have 7 cols');
T.test(testTable1['name'] === 'Cards', 'Cards table has name "Cards"', 'Card table name is not "Cards"');
T.test(testTable1['ok'], 'Cards table is ok"', 'Card table is not ok');

T.test(testTable2.hasOwnProperty('types'), 'Invalid table has property "types"', 'Invalid table does not have property "types"');
T.test(testTable2.hasOwnProperty('cols'), 'Invalid table has property "cols"', 'Invalid table does not have property "cols"');
T.test(testTable2.hasOwnProperty('name'), 'Invalid table has property "name"', 'Invalid table does not have property "name"');
T.test(testTable2.hasOwnProperty('ok'), 'Invalid table has property "ok"', 'Invalid table does not have property "ok"');
T.test(Object.keys(testTable2.types).length === 0, 'Invalid table has no type cols', 'Invalid table has more than 0 types');
T.test(testTable2['cols'].length === 0, 'Invalid table has no named cols', 'Invalid table has more than 0 cols');
T.test(testTable2['name'] === '', 'Invalid table has no name', 'Invalid table has a non-empty name');
T.test(!testTable2['ok'], 'Invalid table is not ok', 'Invalid table should not be ok');

let checkTypesObj1 = {
    name: 'Bob Hill',
    set: 'Zendikar',
    colors: 9,
    cmc: 5,
    data: '{"stuff":"Things"}'
};

let checkTypesObj2 = {
    email: 'bob@thing.com',
    password: '1234',
    username: 'bobbyhill'
}

let checkTypeTest1 = db.checkTypes(db.CARDS, checkTypesObj1);
let checkTypeTest2 = db.checkTypes(db.USERS, checkTypesObj2);
let checkTypeTest3 = db.checkTypes('fail', checkTypesObj2);

//checkTypes(table, obj)

T.group('checkTypes');
T.test(checkTypeTest1.hasOwnProperty('missing'), 'Check type has field "missing"', 'CheckTypes does not have field "missing"');
T.test(checkTypeTest1.hasOwnProperty('missingCount'), 'Check type has field "missingCount"', 'CheckTypes does not have field "missingCount"');
T.test(checkTypeTest1.hasOwnProperty('invalid'), 'Check type has field "invalid"', 'CheckTypes does not have field "invalid"');
T.test(checkTypeTest1.hasOwnProperty('invalidCount'), 'Check type has field "invalidCount"', 'CheckTypes does not have field "invalidCount"');
T.test(checkTypeTest1.hasOwnProperty('valid'), 'Check type has field "valid"', 'CheckTypes does not have field "valid"');
T.test(checkTypeTest1.hasOwnProperty('validCount'), 'Check type has field "validCount"', 'CheckTypes does not have field "validCount"');
T.test(checkTypeTest1.hasOwnProperty('toString'), 'Check type has field "toString"', 'CheckTypes does not have field "toString"');
T.test(checkTypeTest1.hasOwnProperty('ok'), 'Check type has field "ok"', 'CheckTypes does not have field "ok"');
T.test(!checkTypeTest1.ok, 'Query is not ok with invalid/missing returns', 'Card query is ok when it should be not ok');
T.test(checkTypeTest1.missing.hasOwnProperty('rarity'), 'Missing field has property "rarity"', 'Missing is not returning "rarity"');
T.test(checkTypeTest1.missing.hasOwnProperty('default'), 'Missing field has property "default"', 'Missing is not returning "default"');
T.test(checkTypeTest1.invalid.hasOwnProperty('colors'), 'Invalid field has property "colors"', 'Invalid is not returning "colors"');
T.test(checkTypeTest1.valid.hasOwnProperty('cmc'), 'Valid field has property "cmc"', 'Valid does not have key "cmc"');
T.test(checkTypeTest1.valid.hasOwnProperty('set'), 'Valid field has property "set"', 'Valid does not have key "set"');
T.test(checkTypeTest1.valid.hasOwnProperty('name'), 'Valid field has property "name"', 'Valid does not have key "name"');
T.test(checkTypeTest1.valid.hasOwnProperty('data'), 'Valid field has property "data"', 'Valid does not have key "data"');
T.test(checkTypeTest1.validCount === 4, 'ValidCount is 4', 'Valid does not have key "data"');
T.test(checkTypeTest1.invalidCount === 1, 'InvalidCount is 1', 'Invalid count does not equal 1');
T.test(checkTypeTest1.missingCount === 2, 'MissingCount is 2', 'Missing count does not equal 2');
T.test(checkTypeTest2.ok, 'Perfect query is ok', 'User query is not ok');
T.test(!checkTypeTest3.ok, 'Imperfect query is not ok', 'Should return "not ok"');
T.test(checkTypeTest3.hasOwnProperty('error'), 'imperfect query has an error message', 'Should return an error');

//LayoutQueryValueArray(table, obj)
let layoutTest1 = {
    name: 'Bob Hill',
    set: 'Zendikar',
    colors: 9,
    cmc: 5,
    data: '{"stuff":"Things"}'
};

let layout1 = db.layoutQueryValueArray(db.CARDS, db.checkTypes(db.CARDS, layoutTest1).valid);

T.group('layoutQueryValueArray');
T.test(layout1.values[0] === '\'Bob Hill\'', 'First values element is "Bob Hill"', 'First values element is not "Bob Hill"');
T.test(layout1.values[1] === '\'Zendikar\'', 'Second values element is "Zendikar"', 'Second element is not "Zendikar"');
T.test(layout1.values[2] === 5, 'Third values element is "5"', 'Third values element is not "5"');
T.test(layout1.values[3] === '\'{"stuff":"Things"}\'', 'Fourth values element is "{"stuff":"Things"}"', 'Fourth values element is not the "{"stuff":"Things"}"');
T.test(layout1.values.length === 4, 'Length of values is 4', 'Length of values is not 4');
T.test(layout1.cols[0] === 'name', 'First cols element is "name"', 'First cols element is not the name');
T.test(layout1.cols[1] === 'set', 'Second cols element is "set"', 'Second cols element is not the set');
T.test(layout1.cols[2] === 'cmc', 'Third cols element is "cmc"', 'Third cols element is not the cmc');
T.test(layout1.cols[3] === 'data', 'Fourth cols element is "data"', 'Fourth cols element is not the data');
T.test(layout1.values.length === 4, 'Length of cols is 4', 'Length of cols is not 4');

//buildSelectQuery

//Deck reference
let selectObj1 = {
    did: '009988',
    name: 'omnath big',
    email: 'bobhill@zendikar.com'
};

let selectObj2 = {
    name: 'Bob Hill',
    set: 'Zendikar',
    colors: 9,
    cmc: 5,
    data: '{"stuff":"Things"}'
};

let selectTest1 = db.buildSelectQuery(db.DECKS, selectObj1, false);
let selectTest2 = db.buildSelectQuery(db.CARDS, selectObj2, true);

T.group('buildSelectQuery');
T.test(selectTest1.query === 'SELECT did, name, email FROM Decks WHERE did=$1 AND name=$2 AND email=$3;',
    'Select query matches expected output', 'Select query does not match expected output');
T.test(selectTest1.queryData[0] === '\'009988\'', 'Select value 0 is \'009988\'', 'Select value 0 is not \'009988\'')
T.test(selectTest1.queryData[1] === '\'omnath big\'', 'Select value 1 is \'omnath big\'', 'Select value 1 is not \'omnath big\'')
T.test(selectTest1.queryData[2] === '\'bobhill@zendikar.com\'', 'Select value 2 is \'bobhill@zendikar.com\'', 'Select value 2 is not \'bobhill@zendikar.com\'')
T.test(selectTest1.ok, 'Query returning ok', 'Query returning ok');
T.test(!selectTest2.ok, 'Query returning not ok', 'Query returning ok when it should be not ok');
T.test(selectTest2.hasOwnProperty('error'), 'Query has error message', 'Query does not have an error message');

//Deck reference
let insertObj1 = {
    did: '009988',
    name: 'omnath big',
    email: 'bobhill@zendikar.com'
};

let insertObj2 = {
    name: 'Bob Hill',
    set: 'Zendikar',
    colors: 9,
    cmc: 5,
    data: '{"stuff":"Things"}'
};

let insertTest1 = db.buildInsertQuery(db.DECKS, insertObj1);
let insertTest2 = db.buildInsertQuery(db.CARDS, insertObj2);

T.group('buildInsertQuery');
T.test(insertTest1.query === 'INSERT INTO Decks (did, name, email) VALUES ($1, $2, $3);',
    'Insert query matches expected output', 'Insert query does not match expected output');
T.test(insertTest1.queryData[0] === '\'009988\'', 'Select value 0 is \'009988\'', 'Select value 0 is not \'009988\'')
T.test(insertTest1.queryData[1] === '\'omnath big\'', 'Select value 1 is \'omnath big\'', 'Select value 1 is not \'omnath big\'')
T.test(insertTest1.queryData[2] === '\'bobhill@zendikar.com\'', 'Select value 2 is \'bobhill@zendikar.com\'', 'Select value 2 is not \'bobhill@zendikar.com\'')
T.test(insertTest1.ok, 'Query returning ok', 'Query returning ok');
T.test(!insertTest2.ok, 'Query returning not ok', 'Query returning ok when it should be not ok');
T.test(insertTest2.hasOwnProperty('error'), 'Query has error message', 'Query does not have an error message');

T.log(specified);