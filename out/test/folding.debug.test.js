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
describe('Folding Debug Tests', () => {
    describe('Indentation Detection Debug', () => {
        it('should correctly detect indentation levels', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('Raw data:', model.getData());
            const visibleRows = model.getVisibleRows();
            console.log('\nIndentation levels:');
            visibleRows.forEach((row, i) => {
                console.log(`${i}: level=${row.indentLevel}, foldable=${row.isFoldable}, cells=[${row.cells.join(', ')}]`);
            });
            // Verify indentation levels
            assert.strictEqual(visibleRows[0].indentLevel, 0); // Parent
            assert.strictEqual(visibleRows[1].indentLevel, 1); // Child1
            assert.strictEqual(visibleRows[2].indentLevel, 2); // Grandchild1
            assert.strictEqual(visibleRows[3].indentLevel, 2); // Grandchild2
            assert.strictEqual(visibleRows[4].indentLevel, 1); // Child2
            assert.strictEqual(visibleRows[5].indentLevel, 2); // Grandchild3
        });
    });
    describe('Folding Operations Debug', () => {
        it('should test toggleFold operation', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== TOGGLE FOLD TEST ===');
            console.log('Before folding Parent:');
            let visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: ${row.cells.filter(c => c).join(' ')}`);
            });
            // Fold Parent (row 0)
            model.toggleFold(0);
            console.log('\nAfter folding Parent:');
            visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: ${row.cells.filter(c => c).join(' ')}`);
            });
            // Should only show Parent
            assert.strictEqual(visible.length, 1);
            assert.strictEqual(visible[0].cells[0], 'Parent');
        });
        it('should test foldAllDescendants operation', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== FOLD ALL DESCENDANTS TEST ===');
            console.log('Before foldAllDescendants:');
            let visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: folded=${row.isFolded}, ${row.cells.filter(c => c).join(' ')}`);
            });
            // Fold all descendants of Parent (row 0)
            model.foldAllDescendants(0, true);
            console.log('\nAfter foldAllDescendants(0, true):');
            visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: folded=${row.isFolded}, ${row.cells.filter(c => c).join(' ')}`);
            });
            // Debug: Check the metadata directly
            console.log('\nDirect metadata check:');
            for (let i = 0; i < 6; i++) {
                const metadata = model.getRowMetadata(i);
                console.log(`  Row ${i}: isFolded=${metadata === null || metadata === void 0 ? void 0 : metadata.isFolded}, hasChildren=${metadata === null || metadata === void 0 ? void 0 : metadata.hasChildren}`);
            }
            // Expected: Parent should be folded=true, and visible should be just Parent
            // Since Parent is folded, all children should be hidden
            console.log('\nExpected: If Parent is folded, only Parent should be visible');
            // The test expects Parent.isFolded = true
            assert.strictEqual(visible[0].isFolded, true, 'Parent should be folded after foldAllDescendants');
        });
        it('should test unfoldAllDescendants operation', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== UNFOLD ALL DESCENDANTS TEST ===');
            // First fold all
            model.foldAllDescendants(0, true);
            console.log('After folding all descendants:');
            let visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            // Then unfold all
            model.foldAllDescendants(0, false);
            console.log('\nAfter unfolding all descendants:');
            visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: folded=${row.isFolded}, ${row.cells.filter(c => c).join(' ')}`);
            });
            // Should see all 6 rows again
            assert.strictEqual(visible.length, 6);
        });
    });
    describe('Complex Folding Scenarios', () => {
        it('should handle partial folding correctly', () => {
            const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
            const model = new tsvDataModel_1.TSVDataModel(testData);
            console.log('\n=== PARTIAL FOLDING TEST ===');
            // Fold only Child1 (row 1)
            model.toggleFold(1);
            console.log('After folding Child1:');
            let visible = model.getVisibleRows();
            console.log(`Visible rows: ${visible.length}`);
            visible.forEach((row, i) => {
                console.log(`  ${i}: ${row.cells.filter(c => c).join(' ')}`);
            });
            // Should see: Parent, Child1, Child2, Grandchild3
            // Grandchild1 and Grandchild2 should be hidden
            assert.strictEqual(visible.length, 4);
            assert.strictEqual(visible[0].cells[0], 'Parent');
            assert.strictEqual(visible[1].cells[1], 'Child1');
            assert.strictEqual(visible[2].cells[1], 'Child2');
            assert.strictEqual(visible[3].cells[2], 'Grandchild3');
        });
    });
});
//# sourceMappingURL=folding.debug.test.js.map