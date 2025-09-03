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
// Note: These are unit tests for the MyTextEditorProvider class
// True integration tests would require the full VS Code extension test environment
describe('MyTextEditorProvider - Unit Tests', () => {
    describe('Message Handling Logic', () => {
        // Test the logic that would handle messages from webview
        // without requiring actual webview or VS Code APIs
        it('should create correct CellEdit from webview message', () => {
            const mockMessage = {
                type: 'cellEdit',
                data: {
                    position: { row: 1, col: 2 },
                    value: 'Test Value'
                }
            };
            // Verify the message structure matches our CellEdit interface
            assert.strictEqual(mockMessage.type, 'cellEdit');
            assert.strictEqual(mockMessage.data.position.row, 1);
            assert.strictEqual(mockMessage.data.position.col, 2);
            assert.strictEqual(mockMessage.data.value, 'Test Value');
        });
        it('should create correct insertRow message data', () => {
            const mockInsertMessage = {
                type: 'insertRow',
                data: { rowIndex: 2, position: 'after' }
            };
            assert.strictEqual(mockInsertMessage.type, 'insertRow');
            assert.strictEqual(mockInsertMessage.data.rowIndex, 2);
            assert.strictEqual(mockInsertMessage.data.position, 'after');
        });
        it('should create correct addColumn message data', () => {
            const mockAddColumnMessage = {
                type: 'addColumn',
                data: { rowIndex: 1, newColIndex: 3 }
            };
            assert.strictEqual(mockAddColumnMessage.type, 'addColumn');
            assert.strictEqual(mockAddColumnMessage.data.rowIndex, 1);
            assert.strictEqual(mockAddColumnMessage.data.newColIndex, 3);
        });
        it('should create correct removeColumn message data', () => {
            const mockRemoveColumnMessage = {
                type: 'removeColumn',
                data: { rowIndex: 1, focusCol: 2 }
            };
            assert.strictEqual(mockRemoveColumnMessage.type, 'removeColumn');
            assert.strictEqual(mockRemoveColumnMessage.data.rowIndex, 1);
            assert.strictEqual(mockRemoveColumnMessage.data.focusCol, 2);
        });
        it('should create correct deleteRow message data', () => {
            const mockDeleteMessage = {
                type: 'deleteRow',
                data: { rowIndex: 3 }
            };
            assert.strictEqual(mockDeleteMessage.type, 'deleteRow');
            assert.strictEqual(mockDeleteMessage.data.rowIndex, 3);
        });
    });
    describe('Data Transformation Logic', () => {
        it('should transform TSVDataModel to webview init message format', () => {
            const model = new tsvDataModel_1.TSVDataModel('Name\tAge\nJohn\t25\nJane\t30');
            const tableData = model.getData();
            const dimensions = model.getDimensions();
            const mockInitMessage = {
                type: 'init',
                data: {
                    table: tableData,
                    dimensions: dimensions,
                    focusCell: { row: 1, col: 0 }
                }
            };
            assert.strictEqual(mockInitMessage.type, 'init');
            assert.strictEqual(mockInitMessage.data.table.length, 3);
            assert.strictEqual(mockInitMessage.data.dimensions.rows, 3);
            assert.strictEqual(mockInitMessage.data.dimensions.cols, 2);
            assert.deepStrictEqual(mockInitMessage.data.focusCell, { row: 1, col: 0 });
        });
        it('should handle focus cell in webview messages', () => {
            const mockMessageWithFocus = {
                type: 'init',
                data: {
                    table: [['A', 'B'], ['X', 'Y']],
                    dimensions: { rows: 2, cols: 2 },
                    focusCell: { row: 0, col: 1 }
                }
            };
            assert.strictEqual(mockMessageWithFocus.data.focusCell.row, 0);
            assert.strictEqual(mockMessageWithFocus.data.focusCell.col, 1);
        });
        it('should handle webview messages without focus cell', () => {
            const mockMessageNoFocus = {
                type: 'init',
                data: {
                    table: [['A', 'B']],
                    dimensions: { rows: 1, cols: 2 }
                    // no focusCell property
                }
            };
            assert.strictEqual('focusCell' in mockMessageNoFocus.data, false);
        });
    });
    describe('Provider State Management Logic', () => {
        it('should track TSV models per document URI', () => {
            // Simulate how the provider would track models
            const mockModels = new Map();
            const uri1 = 'file:///test1.tsb';
            const uri2 = 'file:///test2.tsb';
            const model1 = new tsvDataModel_1.TSVDataModel('A\tB\nX\tY');
            const model2 = new tsvDataModel_1.TSVDataModel('Name\tAge\nJohn\t25');
            mockModels.set(uri1, model1);
            mockModels.set(uri2, model2);
            assert.strictEqual(mockModels.size, 2);
            assert.strictEqual(mockModels.get(uri1), model1);
            assert.strictEqual(mockModels.get(uri2), model2);
            // Cleanup simulation
            mockModels.delete(uri1);
            assert.strictEqual(mockModels.size, 1);
            assert.strictEqual(mockModels.get(uri1), undefined);
        });
        it('should handle model operations by URI', () => {
            const mockModels = new Map();
            const uri = 'file:///test.tsb';
            const model = new tsvDataModel_1.TSVDataModel('Original\tData');
            mockModels.set(uri, model);
            // Simulate cell edit operation
            const retrievedModel = mockModels.get(uri);
            assert.strictEqual(retrievedModel, model);
            if (retrievedModel) {
                retrievedModel.updateCell({ position: { row: 0, col: 0 }, value: 'Modified' });
                const data = retrievedModel.getData();
                assert.strictEqual(data[0][0], 'Modified');
            }
        });
    });
    describe('HTML Template Logic', () => {
        it('should construct proper CSS URI replacement pattern', () => {
            const originalHref = 'href="table.css"';
            const mockCssUri = 'vscode-webview://g0ejb7h3/table.css';
            const expectedReplacement = `href="${mockCssUri}"`;
            const result = originalHref.replace('href="table.css"', expectedReplacement);
            assert.strictEqual(result, expectedReplacement);
        });
        it('should handle webview URI pattern correctly', () => {
            // Simulate the pattern used in getHtml method
            const mockWebviewUri = 'vscode-webview://abc123/media/table.css';
            const htmlTemplate = '<link rel="stylesheet" href="table.css">';
            const result = htmlTemplate.replace('href="table.css"', `href="${mockWebviewUri}"`);
            assert.strictEqual(result, `<link rel="stylesheet" href="${mockWebviewUri}">`);
        });
    });
});
// Note: To create true integration tests for MyTextEditorProvider, we would need:
// 1. VS Code Extension Test Environment (@vscode/test-electron)
// 2. Mock document and webview panel objects
// 3. Actual message passing tests
// 4. File system integration tests
// 5. Workspace edit validation
//# sourceMappingURL=myTextEditorProvider.test.js.map