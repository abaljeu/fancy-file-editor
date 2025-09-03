import * as assert from 'assert';
import { TSVDataModel, CellEdit } from '../tsvDataModel';

describe('TSVDataModel Integration Tests', () => {
  
  describe('Simulated User Interactions', () => {
    it('should handle typical spreadsheet workflow', () => {
      // Simulate user creating a new table
      const model = new TSVDataModel('');
      
      // User types header row
      model.updateCell({ position: { row: 0, col: 0 }, value: 'Name' });
      model.updateCell({ position: { row: 0, col: 1 }, value: 'Age' });
      model.updateCell({ position: { row: 0, col: 2 }, value: 'City' });
      
      // User presses Enter to create new row
      model.insertRowAfter(0);
      
      // User types first data row  
      model.updateCell({ position: { row: 1, col: 0 }, value: 'John' });
      model.updateCell({ position: { row: 1, col: 1 }, value: '25' });
      model.updateCell({ position: { row: 1, col: 2 }, value: 'New York' });
      
      // Verify the table structure
      const data = model.getData();
      assert.strictEqual(data.length, 2);
      assert.deepStrictEqual(data[0], ['Name', 'Age', 'City']);
      assert.deepStrictEqual(data[1], ['John', '25', 'New York']);
      
      // Verify TSV output (should not have empty row)
      const tsv = model.toTSV();
      const expectedTSV = 'Name\tAge\tCity\nJohn\t25\tNew York';
      assert.strictEqual(tsv, expectedTSV);
    });

    it('should handle Excel-like Enter behavior workflow', () => {
      // User starts with indented table structure
      const model = new TSVDataModel('Section\tHeader\n\tData1\tValue1\n\tData2\tValue2');
      
      // Verify initial state
      let data = model.getData();
      assert.strictEqual(data.length, 3);
      assert.deepStrictEqual(data[1], ['', 'Data1', 'Value1']);
      assert.deepStrictEqual(data[2], ['', 'Data2', 'Value2']);
      
      // User presses Enter on last row (simulating Excel-like behavior)
      const result = model.insertRowWithIndent(2);
      
      // Should create new row with proper indentation
      assert.strictEqual(result.newRowIndex, 3);
      assert.strictEqual(result.focusCol, 1); // Focus on first data column
      
      data = model.getData();
      assert.strictEqual(data.length, 4);
      assert.deepStrictEqual(data[3], ['', '']); // New row with leading tab
    });

    it('should handle Tab at end of row to add column', () => {
      // User has simple table
      const model = new TSVDataModel('A\tB\nX\tY');
      
      // User presses Tab at end of first row (simulated by adding column)
      model.addColumnToRow(0);
      model.updateCell({ position: { row: 0, col: 2 }, value: 'C' });
      
      // Verify ragged array behavior
      const data = model.getData();
      assert.deepStrictEqual(data[0], ['A', 'B', 'C']); // Row 0 has 3 columns
      assert.deepStrictEqual(data[1], ['X', 'Y']);       // Row 1 still has 2 columns
      
      // Verify TSV maintains ragged structure
      const tsv = model.toTSV();
      assert.strictEqual(tsv, 'A\tB\tC\nX\tY');
    });

    it('should handle Backspace at beginning of last cell to remove column', () => {
      // User has table with extra column
      const model = new TSVDataModel('A\tB\tC\nX\tY\tZ');
      
      // User presses Backspace at beginning of last cell in row
      const removed = model.removeLastColumnFromRow(1);
      
      assert.strictEqual(removed, true);
      const data = model.getData();
      assert.deepStrictEqual(data[1], ['X', 'Y']); // Last column removed
      assert.deepStrictEqual(data[0], ['A', 'B', 'C']); // Other row unchanged
    });

    it('should handle Backspace on empty row to delete row', () => {
      // User has table with empty row
      const model = new TSVDataModel('A\tB\n\nC\tD');
      
      // Verify initial state has empty row
      let data = model.getData();
      assert.strictEqual(data.length, 3);
      assert.deepStrictEqual(data[1], ['']); // Empty row
      
      // User presses Backspace on empty row
      model.deleteRow(1);
      
      // Empty row should be removed
      data = model.getData();
      assert.strictEqual(data.length, 2);
      assert.deepStrictEqual(data[0], ['A', 'B']);
      assert.deepStrictEqual(data[1], ['C', 'D']);
    });

    it('should handle complex editing session with mixed operations', () => {
      // Start with basic table
      const model = new TSVDataModel('Name\tAge\nJohn\t25\nJane\t30');
      
      // User performs complex editing session:
      
      // 1. Add a new column to header
      model.addColumnToRow(0);
      model.updateCell({ position: { row: 0, col: 2 }, value: 'City' });
      
      // 2. Fill in city data for existing rows
      model.updateCell({ position: { row: 1, col: 2 }, value: 'New York' });
      model.updateCell({ position: { row: 2, col: 2 }, value: 'London' });
      
      // 3. Insert new row in middle
      model.insertRowAfter(1);
      model.updateCell({ position: { row: 2, col: 0 }, value: 'Bob' });
      model.updateCell({ position: { row: 2, col: 1 }, value: '35' });
      model.updateCell({ position: { row: 2, col: 2 }, value: 'Paris' });
      
      // 4. Remove a column from one row (creating ragged array)
      model.removeLastColumnFromRow(3);
      
      // Verify final state
      const data = model.getData();
      assert.strictEqual(data.length, 4);
      assert.deepStrictEqual(data[0], ['Name', 'Age', 'City']);
      assert.deepStrictEqual(data[1], ['John', '25', 'New York']);
      assert.deepStrictEqual(data[2], ['Bob', '35', 'Paris']);
      assert.deepStrictEqual(data[3], ['Jane', '30']); // Ragged: missing city
      
      // Verify TSV output maintains structure
      const tsv = model.toTSV();
      const expectedLines = [
        'Name\tAge\tCity',
        'John\t25\tNew York', 
        'Bob\t35\tParis',
        'Jane\t30'
      ];
      assert.strictEqual(tsv, expectedLines.join('\n'));
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain consistency through round-trip operations', () => {
      const originalTSV = 'Header\tData\n\tValue1\tExtra\n\tValue2\nFooter\tInfo';
      
      // Parse → Modify → Serialize → Parse again
      const model1 = new TSVDataModel(originalTSV);
      model1.insertRowAfter(2);
      model1.updateCell({ position: { row: 3, col: 0 }, value: 'New' });
      
      const modifiedTSV = model1.toTSV();
      const model2 = new TSVDataModel(modifiedTSV);
      
      // Both models should have identical data
      assert.deepStrictEqual(model1.getData(), model2.getData());
      assert.strictEqual(model1.toTSV(), model2.toTSV());
    });

    it('should handle edge case sequences gracefully', () => {
      const model = new TSVDataModel('A');
      
      // Sequence of operations that could cause issues
      model.updateCell({ position: { row: 5, col: 5 }, value: 'Far' }); // Expand dramatically
      model.deleteRow(3); // Delete middle row
      model.removeLastColumnFromRow(0); // Try to remove from short row
      model.insertRowAfter(0); // Insert row
      model.addColumnToRow(1); // Add column to new row
      
      // Should still have valid structure
      const data = model.getData();
      assert.strictEqual(data.length > 0, true);
      
      // Should be able to serialize without errors
      const tsv = model.toTSV();
      assert.strictEqual(typeof tsv, 'string');
      
      // Should be able to parse the result
      const reconstructed = new TSVDataModel(tsv);
      assert.deepStrictEqual(reconstructed.getData(), data);
    });
  });
});
