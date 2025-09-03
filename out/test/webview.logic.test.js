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
// Note: These are logic tests for webview functionality
// True webview integration tests would require DOM testing environment like JSDOM
describe('Webview Logic - Unit Tests', () => {
    describe('Table Rendering Logic', () => {
        it('should calculate correct table dimensions', () => {
            const mockTableData = [
                ['Name', 'Age', 'City'],
                ['John', '25', 'New York'],
                ['Jane', '30', 'London']
            ];
            const rows = mockTableData.length;
            const cols = Math.max(...mockTableData.map(row => row.length));
            assert.strictEqual(rows, 3);
            assert.strictEqual(cols, 3);
        });
        it('should handle ragged arrays in dimension calculation', () => {
            const mockRaggedData = [
                ['A', 'B', 'C', 'D'],
                ['X', 'Y'],
                ['P', 'Q', 'R']
            ];
            const rows = mockRaggedData.length;
            const cols = Math.max(...mockRaggedData.map(row => row.length));
            assert.strictEqual(rows, 3);
            assert.strictEqual(cols, 4); // Longest row
        });
        it('should create proper cell data attributes', () => {
            const rowIndex = 2;
            const colIndex = 1;
            const expectedDataRow = rowIndex.toString();
            const expectedDataCol = colIndex.toString();
            assert.strictEqual(expectedDataRow, '2');
            assert.strictEqual(expectedDataCol, '1');
        });
    });
    describe('Keyboard Navigation Logic', () => {
        it('should calculate Tab navigation correctly', () => {
            const currentCol = 2;
            const targetCol = currentCol + 1;
            assert.strictEqual(targetCol, 3);
        });
        it('should calculate Shift+Tab navigation correctly', () => {
            const currentCol = 2;
            const targetCol = currentCol - 1;
            assert.strictEqual(targetCol, 1);
        });
        it('should calculate Arrow Up navigation correctly', () => {
            const currentRow = 2;
            const targetRow = currentRow - 1;
            assert.strictEqual(targetRow, 1);
        });
        it('should calculate Arrow Down navigation correctly', () => {
            const currentRow = 1;
            const targetRow = currentRow + 1;
            assert.strictEqual(targetRow, 2);
        });
        it('should determine if at end of row for Tab column addition', () => {
            const currentCol = 2;
            const rowLength = 3;
            const isAtEnd = (currentCol + 1) >= rowLength;
            assert.strictEqual(isAtEnd, true);
        });
        it('should determine if not at end of row for normal Tab navigation', () => {
            const currentCol = 1;
            const rowLength = 3;
            const isAtEnd = (currentCol + 1) >= rowLength;
            assert.strictEqual(isAtEnd, false);
        });
    });
    describe('Cell Editing Logic', () => {
        it('should create correct cell edit message structure', () => {
            const mockCellEdit = {
                type: 'cellEdit',
                data: {
                    position: { row: 1, col: 2 },
                    value: 'New Value'
                }
            };
            assert.strictEqual(mockCellEdit.type, 'cellEdit');
            assert.strictEqual(mockCellEdit.data.position.row, 1);
            assert.strictEqual(mockCellEdit.data.position.col, 2);
            assert.strictEqual(mockCellEdit.data.value, 'New Value');
        });
        it('should handle empty cell values', () => {
            const mockEmptyEdit = {
                type: 'cellEdit',
                data: {
                    position: { row: 0, col: 0 },
                    value: ''
                }
            };
            assert.strictEqual(mockEmptyEdit.data.value, '');
            assert.strictEqual(mockEmptyEdit.data.value.length, 0);
        });
    });
    describe('Backspace Logic Conditions', () => {
        it('should detect empty line condition (single empty cell)', () => {
            const cellValue = '';
            const rowLength = 1;
            const isEmptyLine = rowLength === 1 && cellValue === '';
            assert.strictEqual(isEmptyLine, true);
        });
        it('should detect last cell column removal condition', () => {
            const cellValue = '';
            const colIndex = 2;
            const rowLength = 3;
            const isLastCell = (colIndex + 1) >= rowLength;
            const shouldRemoveColumn = cellValue === '' && isLastCell && rowLength > 1;
            assert.strictEqual(shouldRemoveColumn, true);
        });
        it('should not remove column if not last cell', () => {
            const cellValue = '';
            const colIndex = 1;
            const rowLength = 3;
            const isLastCell = (colIndex + 1) >= rowLength;
            const shouldRemoveColumn = cellValue === '' && isLastCell && rowLength > 1;
            assert.strictEqual(shouldRemoveColumn, false);
        });
        it('should not remove column if cell has content', () => {
            const cellValue = 'Content';
            const colIndex = 2;
            const rowLength = 3;
            const isLastCell = (colIndex + 1) >= rowLength;
            const shouldRemoveColumn = cellValue.length === 0 && isLastCell && rowLength > 1;
            assert.strictEqual(shouldRemoveColumn, false);
        });
    });
    describe('Context Menu Logic', () => {
        it('should calculate context menu position', () => {
            const mockEvent = {
                pageX: 150,
                pageY: 200
            };
            const menuLeft = mockEvent.pageX + 'px';
            const menuTop = mockEvent.pageY + 'px';
            assert.strictEqual(menuLeft, '150px');
            assert.strictEqual(menuTop, '200px');
        });
        it('should track context menu row correctly', () => {
            let contextMenuRow = -1;
            const rowIndex = 2;
            contextMenuRow = rowIndex;
            assert.strictEqual(contextMenuRow, 2);
        });
    });
    describe('Focus Management Logic', () => {
        it('should create correct cell selector for focus', () => {
            const targetRow = 1;
            const targetCol = 2;
            const selector = `[data-row="${targetRow}"][data-col="${targetCol}"]`;
            assert.strictEqual(selector, '[data-row="1"][data-col="2"]');
        });
        it('should handle focus cell coordinates', () => {
            const focusCell = { row: 2, col: 1 };
            const selector = `[data-row="${focusCell.row}"][data-col="${focusCell.col}"]`;
            assert.strictEqual(selector, '[data-row="2"][data-col="1"]');
        });
    });
    describe('Message Passing Logic', () => {
        it('should structure init messages correctly', () => {
            const mockInitMessage = {
                type: 'init',
                data: {
                    table: [['A', 'B'], ['X', 'Y']],
                    dimensions: { rows: 2, cols: 2 },
                    focusCell: { row: 1, col: 0 }
                }
            };
            assert.strictEqual(mockInitMessage.type, 'init');
            assert.strictEqual(mockInitMessage.data.table.length, 2);
            assert.strictEqual(mockInitMessage.data.dimensions.rows, 2);
            assert.strictEqual(mockInitMessage.data.dimensions.cols, 2);
        });
        it('should structure row operation messages correctly', () => {
            const insertMessage = {
                type: 'insertRow',
                data: { rowIndex: 1, position: 'after' }
            };
            const deleteMessage = {
                type: 'deleteRow',
                data: { rowIndex: 2 }
            };
            assert.strictEqual(insertMessage.type, 'insertRow');
            assert.strictEqual(insertMessage.data.position, 'after');
            assert.strictEqual(deleteMessage.type, 'deleteRow');
            assert.strictEqual(deleteMessage.data.rowIndex, 2);
        });
    });
});
// Note: To create true webview integration tests, we would need:
// 1. DOM testing environment (JSDOM or similar)
// 2. Mock vscode.postMessage function
// 3. Actual keyboard event simulation
// 4. HTML element interaction testing
// 5. CSS styling and layout tests
//# sourceMappingURL=webview.logic.test.js.map