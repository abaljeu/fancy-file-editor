"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsvDataModel_1 = require("../tsvDataModel");
// Debug the folding implementation
const testData = 'Name\tAge\tCity\n\tJohn\t25\tNew York\n\t\tGood\n\t\texcellent\n\tJane\t30\tLondon\nSection\tHeader\tInfo';
console.log('Test data:', JSON.stringify(testData));
const model = new tsvDataModel_1.TSVDataModel(testData);
const data = model.getData();
console.log('Parsed data:', JSON.stringify(data, null, 2));
const visibleRows = model.getVisibleRows();
console.log('Visible rows:', JSON.stringify(visibleRows, null, 2));
//# sourceMappingURL=debug-folding.js.map