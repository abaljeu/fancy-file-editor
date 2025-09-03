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
describe('Folding Debug - foldAllDescendants', () => {
    it('should fold parent AND mark all descendants as folded', () => {
        const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
        const model = new tsvDataModel_1.TSVDataModel(testData);
        // Initial state: all visible
        let visible = model.getVisibleRows();
        assert.strictEqual(visible.length, 6, 'Should start with 6 visible rows');
        // Test foldAllDescendants(0, true) - should fold Parent AND all descendants
        model.foldAllDescendants(0, true);
        visible = model.getVisibleRows();
        assert.strictEqual(visible.length, 1, 'After foldAllDescendants(0, true), only Parent should be visible');
        assert.strictEqual(visible[0].isFolded, true, 'Parent should be folded');
        assert.strictEqual(visible[0].cells.filter(c => c).join(' '), 'Parent', 'Only Parent row should be visible');
        // Test unfoldAllDescendants - should show immediate children with their fold states preserved
        model.foldAllDescendants(0, false);
        visible = model.getVisibleRows();
        assert.strictEqual(visible.length, 6, 'After unfoldAllDescendants, all rows should be visible again');
        // Check that Parent is unfolded
        const parentRow = visible.find(row => row.cells.filter(c => c).join(' ') === 'Parent');
        assert.strictEqual(parentRow === null || parentRow === void 0 ? void 0 : parentRow.isFolded, false, 'Parent should be unfolded');
        // Check that Child1 and Child2 are unfolded (they were marked as folded but now unfolded)
        const child1Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child1');
        const child2Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child2');
        assert.strictEqual(child1Row === null || child1Row === void 0 ? void 0 : child1Row.isFolded, false, 'Child1 should be unfolded');
        assert.strictEqual(child2Row === null || child2Row === void 0 ? void 0 : child2Row.isFolded, false, 'Child2 should be unfolded');
    });
    it('should demonstrate the difference between toggleFold and foldAllDescendants', () => {
        const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
        const model = new tsvDataModel_1.TSVDataModel(testData);
        // Test toggleFold - only folds the parent, doesn't affect children's fold state
        model.toggleFold(0);
        let visible = model.getVisibleRows();
        assert.strictEqual(visible.length, 1, 'toggleFold should hide all descendants');
        // Unfold to see children
        model.toggleFold(0);
        visible = model.getVisibleRows();
        assert.strictEqual(visible.length, 6, 'Should see all rows again');
        // Children should still have their original fold state (false)
        const child1Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child1');
        const child2Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child2');
        assert.strictEqual(child1Row === null || child1Row === void 0 ? void 0 : child1Row.isFolded, false, 'Child1 fold state unchanged by toggleFold');
        assert.strictEqual(child2Row === null || child2Row === void 0 ? void 0 : child2Row.isFolded, false, 'Child2 fold state unchanged by toggleFold');
    });
});
//# sourceMappingURL=folding.debug.test.js.map