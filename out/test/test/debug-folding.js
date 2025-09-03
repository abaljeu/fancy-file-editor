"use strict";
exports.__esModule = true;
var tsvDataModel_1 = require("../tsvDataModel");
// Debug the folding implementation
var testData = 'Name\tAge\tCity\n\tJohn\t25\tNew York\n\t\tGood\n\t\texcellent\n\tJane\t30\tLondon\nSection\tHeader\tInfo';
console.log('Test data:', JSON.stringify(testData));
var model = new tsvDataModel_1.TSVDataModel(testData);
var data = model.getData();
console.log('Parsed data:', JSON.stringify(data, null, 2));
var visibleRows = model.getVisibleRows();
console.log('Visible rows:', JSON.stringify(visibleRows, null, 2));
