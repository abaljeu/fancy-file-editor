"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const tsvDataModel_1 = require("../tsvDataModel");
describe('Folding Debug - New Implementation', () => {
    describe('Basic Operations Test', () => {
        it('should test the new data model implementation', () => {
            var _a, _b, _c;
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== INITIAL STATE ===');
            let visible = model.getVisibleRows();
            console.log('Visible rows:', visible.length);
            visible.forEach((row, i) => {
                const text = row.cells.filter(c => c).join(' ');
                console.log(`Row ${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\n=== CALLING toggleFold(0) ===');
            console.log('This should use FoldSelf operation');
            model.toggleFold(0);
            visible = model.getVisibleRows();
            console.log('Visible rows after toggleFold(0):', visible.length);
            visible.forEach((row, i) => {
                const text = row.cells.filter(c => c).join(' ');
                console.log(`Row ${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\n=== CALLING toggleFold(0) again ===');
            console.log('This should use UnfoldSelf operation');
            model.toggleFold(0);
            visible = model.getVisibleRows();
            console.log('Visible rows after second toggleFold(0):', visible.length);
            visible.forEach((row, i) => {
                const text = row.cells.filter(c => c).join(' ');
                console.log(`Row ${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\n=== CALLING recursiveFold(0) ===');
            console.log('This should use RecursiveFold operation');
            model.recursiveFold(0);
            visible = model.getVisibleRows();
            console.log('Visible rows after recursiveFold(0):', visible.length);
            visible.forEach((row, i) => {
                const text = row.cells.filter(c => c).join(' ');
                console.log(`Row ${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\n=== EXPECTED FOR FAILING TEST ===');
            console.log('The failing test expects:');
            console.log('- 3 visible rows (Parent, Child1, Child2)');
            console.log('- Parent.isFolded=true, Child1.isFolded=true, Child2.isFolded=true');
            console.log('- Grandchildren hidden');
            console.log('\nActual result:', visible.length, 'visible rows');
            if (visible.length >= 3) {
                console.log('Parent folded:', (_a = visible[0]) === null || _a === void 0 ? void 0 : _a.isFolded);
                console.log('Child1 folded:', (_b = visible[1]) === null || _b === void 0 ? void 0 : _b.isFolded);
                console.log('Child2 folded:', (_c = visible[2]) === null || _c === void 0 ? void 0 : _c.isFolded);
            }
            // Test that recursiveFold works as expected
            assert.strictEqual(visible.length, 1, 'Only Parent should be visible after recursiveFold');
            assert.strictEqual(visible[0].isFolded, true, 'Parent should be folded');
        });
        it('should test recursiveUnfold operation', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== TESTING RECURSIVE UNFOLD ===');
            // First, fold everything recursively
            model.recursiveFold(0);
            console.log('After recursiveFold(0): Only Parent should be visible');
            let visible = model.getVisibleRows();
            console.log('Visible rows:', visible.length);
            // Now unfold recursively
            console.log('\n=== CALLING recursiveUnfold(0) ===');
            console.log('This should make all rows visible and unfold all nodes');
            model.recursiveUnfold(0);
            visible = model.getVisibleRows();
            console.log('Visible rows after recursiveUnfold(0):', visible.length);
            visible.forEach((row, i) => {
                const text = row.cells.filter(c => c).join(' ');
                console.log(`Row ${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            // Test that all rows are visible and unfoldable nodes are unfolded
            assert.strictEqual(visible.length, 6, 'All 6 rows should be visible after recursiveUnfold');
            assert.strictEqual(visible[0].isFolded, false, 'Parent should be unfolded');
            assert.strictEqual(visible[1].isFolded, false, 'Child1 should be unfolded');
            assert.strictEqual(visible[4].isFolded, false, 'Child2 should be unfolded');
        });
        it('should debug the failing partial folding test', () => {
            var _a, _b, _c, _d, _e, _f;
            const testData = 'Root\n\tSection1\n\t\tItem1\n\t\tItem2\n\tSection2\n\t\tItem3\n\t\tItem4';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== DEBUGGING PARTIAL FOLDING TEST ===');
            console.log('Initial state:');
            let visible = model.getVisibleRows();
            visible.forEach((row, i) => {
                const text = row.cells[0].trim();
                console.log(`${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\nFolding Section1 (index 1)...');
            model.toggleFold(1);
            visible = model.getVisibleRows();
            console.log(`After folding Section1: ${visible.length} visible`);
            visible.forEach((row, i) => {
                const text = row.cells[0].trim();
                console.log(`${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\nTest expects:');
            console.log('- 5 visible rows: Root, Section1, Section2, Item3, Item4');
            console.log('- Section2 children (Item3, Item4) should still be visible');
            // Fix: Look for Section2 in the right cell (it's in cells[1], not cells[0])
            const section2Index = visible.findIndex(row => {
                const lastCell = row.cells[row.cells.length - 1] || '';
                return lastCell.trim() === 'Section2';
            });
            console.log(`Section2 found at index: ${section2Index}`);
            if (section2Index >= 0 && section2Index + 2 < visible.length) {
                const item3 = (_c = (_a = visible[section2Index + 1]) === null || _a === void 0 ? void 0 : _a.cells[((_b = visible[section2Index + 1]) === null || _b === void 0 ? void 0 : _b.cells.length) - 1]) === null || _c === void 0 ? void 0 : _c.trim();
                const item4 = (_f = (_d = visible[section2Index + 2]) === null || _d === void 0 ? void 0 : _d.cells[((_e = visible[section2Index + 2]) === null || _e === void 0 ? void 0 : _e.cells.length) - 1]) === null || _f === void 0 ? void 0 : _f.trim();
                console.log(`Item after Section2: "${item3}"`);
                console.log(`Second item after Section2: "${item4}"`);
            }
        });
        it('should debug the failing fold state preservation test', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\tChild2\n\t\tGrandchild2';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== DEBUGGING FOLD STATE PRESERVATION TEST ===');
            console.log('Initial state:');
            let visible = model.getVisibleRows();
            visible.forEach((row, i) => {
                const text = row.cells[0].trim();
                console.log(`${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\nFolding Child1 (index 1)...');
            model.toggleFold(1);
            visible = model.getVisibleRows();
            console.log(`After folding Child1: ${visible.length} visible`);
            visible.forEach((row, i) => {
                const text = row.cells[0].trim();
                console.log(`${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\nInserting row at index 2...');
            model.insertRow(2);
            visible = model.getVisibleRows();
            console.log(`After inserting row: ${visible.length} visible`);
            visible.forEach((row, i) => {
                const text = row.cells[0].trim();
                console.log(`${i}: "${text}" - indent:${row.indentLevel}, foldable:${row.isFoldable}, folded:${row.isFolded}`);
            });
            console.log('\nLooking for Child1...');
            // Fix: Look for Child1 in the right cell
            const child1Row = visible.find(row => {
                const lastCell = row.cells[row.cells.length - 1] || '';
                return lastCell.trim() === 'Child1';
            });
            console.log(`Child1 found: ${child1Row ? 'Yes' : 'No'}`);
            if (child1Row) {
                console.log(`Child1 folded: ${child1Row.isFolded}`);
            }
        });
        it('should debug the data parsing issue', () => {
            const testData = 'Root\n\tSection1\n\t\tItem1\n\t\tItem2\n\tSection2\n\t\tItem3\n\t\tItem4';
            console.log('\n=== DEBUGGING DATA PARSING ===');
            console.log('Original TSV data:');
            console.log(JSON.stringify(testData));
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\nParsed data structure:');
            const visible = model.getVisibleRows();
            visible.forEach((row, i) => {
                var _a, _b, _c;
                console.log(`Row ${i}:`, JSON.stringify(row.cells));
                console.log(`  Cell[0]: "${row.cells[0]}" (length: ${(_a = row.cells[0]) === null || _a === void 0 ? void 0 : _a.length})`);
                console.log(`  Cell[1]: "${row.cells[1]}" (length: ${(_b = row.cells[1]) === null || _b === void 0 ? void 0 : _b.length})`);
                console.log(`  Cell[0].trim(): "${(_c = row.cells[0]) === null || _c === void 0 ? void 0 : _c.trim()}"`);
            });
        });
    });
});
//# sourceMappingURL=folding.debug.test.js.map