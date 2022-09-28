import { db } from "./database.js";
import { Tester } from "./testHelper.js";

let specified = process.argv.slice(2);

let T = new Tester();
// T.init({ passed: true, failed: true });
T.init({ passed: false, failed: true, run: specified });
// T.init({ passed: true, failed: false });
// T.init({ passed: false, failed: false });

//getTable

db.setTableData();
let testTable1 = db.cardTable;
let testTable2 = db.dudTable;

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
    cardname: 'Bob Hill',
    setname: 'Zendikar',
    colors: 9,
    cmc: 5,
    bulk: { "stuff": "Things" }
};

let checkTypesObj2 = {
    email: 'bob@thing.com',
    password: '1234',
    username: 'bobbyhill'
}

let checkTypeTest1 = db.checkTypes(db.cardTable, checkTypesObj1);
let checkTypeTest2 = db.checkTypes(db.userTable, checkTypesObj2);
let checkTypeTest3 = db.checkTypes(db.dudTable, checkTypesObj2);

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
T.test(checkTypeTest1.missing.hasOwnProperty('defaultcard'), 'Missing field has property "defaultcard"', 'Missing is not returning "defaultcard"');
T.test(checkTypeTest1.invalid.hasOwnProperty('colors'), 'Invalid field has property "colors"', 'Invalid is not returning "colors"');
T.test(checkTypeTest1.valid.hasOwnProperty('cmc'), 'Valid field has property "cmc"', 'Valid does not have key "cmc"');
T.test(checkTypeTest1.valid.hasOwnProperty('setname'), 'Valid field has property "setname"', 'Valid does not have key "setname"');
T.test(checkTypeTest1.valid.hasOwnProperty('cardname'), 'Valid field has property "cardname"', 'Valid does not have key "cardname"');
T.test(checkTypeTest1.valid.hasOwnProperty('bulk'), 'Valid field has property "bulk"', 'Valid does not have key "bulk"');
T.test(checkTypeTest1.validCount === 4, 'ValidCount is 4', 'Valid does not have key "data"');
T.test(checkTypeTest1.invalidCount === 1, 'InvalidCount is 1', 'Invalid count does not equal 1');
T.test(checkTypeTest1.missingCount === 2, 'MissingCount is 2', 'Missing count does not equal 2');
T.test(checkTypeTest2.ok, 'Perfect query is ok', 'User query is not ok');
T.test(!checkTypeTest3.ok, 'Imperfect query is not ok', 'Should return "not ok"');
T.test(checkTypeTest3.hasOwnProperty('error'), 'imperfect query has an error message', 'Should return an error');

//LayoutQueryValueArray(table, obj)
let x = { "stuff": "Things" };

let layoutTest1 = {
    cardname: 'Bob Hill',
    setname: 'Zendikar',
    colors: 9,
    cmc: 5,
    bulk: x
};

let layout1 = db.layoutQueryValueArray(db.cardTable, db.checkTypes(db.cardTable, layoutTest1).valid);

T.group('layoutQueryValueArray');
T.test(layout1.values[0] === 'Bob Hill', 'First values element is "Bob Hill"', 'First values element is not "Bob Hill"');
T.test(layout1.values[1] === 'Zendikar', 'Second values element is "Zendikar"', 'Second element is not "Zendikar"');
T.test(layout1.values[2] === 5, 'Third values element is "5"', 'Third values element is not "5"');
T.test(layout1.values[3] === x, 'Fourth values element is "{"stuff":"Things"}"', 'Fourth values element is not "{"stuff":"Things"}"');
T.test(layout1.values.length === 4, 'Length of values is 4', 'Length of values is not 4');
T.test(layout1.cols[0] === 'cardname', 'First cols element is "name"', 'First cols element is not the name');
T.test(layout1.cols[1] === 'setname', 'Second cols element is "set"', 'Second cols element is not the set');
T.test(layout1.cols[2] === 'cmc', 'Third cols element is "cmc"', 'Third cols element is not the cmc');
T.test(layout1.cols[3] === 'bulk', 'Fourth cols element is "data"', 'Fourth cols element is not the data');
T.test(layout1.values.length === 4, 'Length of cols is 4', 'Length of cols is not 4');

let y = { "stuff": "Things" };

let query = {
    cardname: 'Bob Hill',
    setname: 'Zendikar',
    colors: 9,
    cmc: 5,
    bulk: y
};

let purified = db.purifyQuery(db.cardTable, query);

T.group('purifyQuery');
T.test(purified.hasOwnProperty('cols'), 'Returned query has property "cols"', 'Returned query does not have property "cols"');
T.test(purified.hasOwnProperty('values'), 'Returned query has property "values"', 'Returned query does not have property "values"');
T.test(purified.hasOwnProperty('cols'), 'Returned query has property "name"', 'Returned query does not have property "name"');
T.test(purified.name === 'Cards', 'The "name" property equals "Cards"', 'The "name" property does not equal "Cards"');
T.test(Array.isArray(purified.cols), 'The "cols" property is an array', 'The cols property is not an array');
T.test(purified.values[0] === 'Bob Hill', 'First values element is "Bob Hill"', 'First values element is not "Bob Hill"');
T.test(purified.values[1] === 'Zendikar', 'Second values element is "Zendikar"', 'Second element is not "Zendikar"');
T.test(purified.values[2] === 5, 'Third values element is "5"', 'Third values element is not "5"');
T.test(purified.values[3] === y, 'Fourth values element is "{"stuff":"Things"}"', 'Fourth values element is not the "{"stuff":"Things"}"');
T.test(purified.values.length === 4, 'Length of values is 4', 'Length of values is not 4');
T.test(purified.cols[0] === 'cardname', 'First cols element is "name"', 'First cols element is not the name');
T.test(purified.cols[1] === 'setname', 'Second cols element is "set"', 'Second cols element is not the set');
T.test(purified.cols[2] === 'cmc', 'Third cols element is "cmc"', 'Third cols element is not the cmc');
T.test(purified.cols[3] === 'bulk', 'Fourth cols element is "data"', 'Fourth cols element is not the data');
T.test(purified.values.length === 4, 'Length of cols is 4', 'Length of cols is not 4');

T.log();