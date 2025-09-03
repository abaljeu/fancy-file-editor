import * as assert from 'assert';
import { TSVDataModel, CellEdit, CellPosition } from '../tsvDataModel';

describe('TSVDataModel', () => {
  
  describe('Parsing and Serialization', () => {
    it('should parse simple TSV text', () => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLondon';
      const model = new TSVDataModel(tsvText);
      const data = model.getData();
      
      assert.strictEqual(data.length, 3);
      assert.deepStrictEqual(data[0], ['Name', 'Age', 'City']);
      assert.deepStrictEqual(data[1], ['John', '25', 'New York']);
      assert.deepStrictEqual(data[2], ['Jane', '30', 'London']);
    });

    it('should handle empty TSV text', () => {
      const model = new TSVDataModel('');
      const data = model.getData();
      
      assert.strictEqual(data.length, 1);
      assert.deepStrictEqual(data[0], ['']);
    });

    it('should handle ragged arrays (different row lengths)', () => {
      const tsvText = 'A\tB\tC\nX\tY\nP';
      const model = new TSVDataModel(tsvText);
      const data = model.getData();
      
      assert.strictEqual(data.length, 3);
      assert.deepStrictEqual(data[0], ['A', 'B', 'C']);
      assert.deepStrictEqual(data[1], ['X', 'Y']);
      assert.deepStrictEqual(data[2], ['P']);
    });

    it('should serialize data back to TSV format', () => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York';
      const model = new TSVDataModel(tsvText);
      const serialized = model.toTSV();
      
      assert.strictEqual(serialized, tsvText);
    });

    it('should handle empty cells in serialization', () => {
      const tsvText = 'A\t\tC\n\tB\t';
      const model = new TSVDataModel(tsvText);
      const serialized = model.toTSV();
      
      assert.strictEqual(serialized, tsvText);
    });
  });

  describe('Cell Operations', () => {
    let model: TSVDataModel;

    beforeEach(() => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLondon';
      model = new TSVDataModel(tsvText);
    });

    it('should update existing cell', () => {
      const edit: CellEdit = {
        position: { row: 1, col: 0 },
        value: 'Johnny'
      };
      
      model.updateCell(edit);
      const data = model.getData();
      
      assert.strictEqual(data[1][0], 'Johnny');
    });

    it('should expand table when updating cell beyond current bounds', () => {
      const edit: CellEdit = {
        position: { row: 5, col: 3 },
        value: 'New Value'
      };
      
      model.updateCell(edit);
      const data = model.getData();
      
      assert.strictEqual(data.length, 6); // 0-5 = 6 rows
      assert.strictEqual(data[5][3], 'New Value');
      // Check that empty cells are filled
      assert.strictEqual(data[5][0], '');
      assert.strictEqual(data[5][1], '');
      assert.strictEqual(data[5][2], '');
    });

    it('should get correct table dimensions', () => {
      const dimensions = model.getDimensions();
      
      assert.strictEqual(dimensions.rows, 3);
      assert.strictEqual(dimensions.cols, 3);
    });

    it('should handle dimensions with ragged arrays', () => {
      const raggedModel = new TSVDataModel('A\tB\tC\nX\nP\tQ\tR\tS');
      const dimensions = raggedModel.getDimensions();
      
      assert.strictEqual(dimensions.rows, 3);
      assert.strictEqual(dimensions.cols, 4); // Longest row has 4 columns
    });
  });

  describe('Row Operations', () => {
    let model: TSVDataModel;

    beforeEach(() => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLondon';
      model = new TSVDataModel(tsvText);
    });

    it('should insert row after specified index', () => {
      model.insertRowAfter(1);
      const data = model.getData();
      
      assert.strictEqual(data.length, 4);
      assert.deepStrictEqual(data[2], ['']); // New row with single empty cell
      assert.deepStrictEqual(data[3], ['Jane', '30', 'London']); // Original row moved down
    });

    it('should insert row before specified index', () => {
      model.insertRowBefore(1);
      const data = model.getData();
      
      assert.strictEqual(data.length, 4);
      assert.deepStrictEqual(data[1], ['']); // New row with single empty cell
      assert.deepStrictEqual(data[2], ['John', '25', 'New York']); // Original row moved down
    });

    it('should delete row at specified index', () => {
      model.deleteRow(1);
      const data = model.getData();
      
      assert.strictEqual(data.length, 2);
      assert.deepStrictEqual(data[0], ['Name', 'Age', 'City']);
      assert.deepStrictEqual(data[1], ['Jane', '30', 'London']); // John's row removed
    });

    it('should not delete last remaining row', () => {
      const singleRowModel = new TSVDataModel('Only\tRow');
      singleRowModel.deleteRow(0);
      const data = singleRowModel.getData();
      
      assert.strictEqual(data.length, 1); // Row should still exist
    });

    it('should insert row with Excel-like indentation', () => {
      // Create model with indented structure
      const indentedModel = new TSVDataModel('Header\tData\n\tJohn\t25\n\tJane\t30');
      const result = indentedModel.insertRowWithIndent(1);
      const data = indentedModel.getData();
      
      assert.strictEqual(result.newRowIndex, 2);
      assert.strictEqual(result.focusCol, 1); // First data column
      assert.strictEqual(data.length, 4);
      assert.deepStrictEqual(data[2], ['', '']); // New row with leading tab
    });

    it('should handle Excel-like indentation with no indentation in reference row', () => {
      const result = model.insertRowWithIndent(0);
      const data = model.getData();
      
      assert.strictEqual(result.focusCol, 0); // No indentation needed
      assert.deepStrictEqual(data[1], ['']); // Single cell
    });
  });

  describe('Column Operations', () => {
    let model: TSVDataModel;

    beforeEach(() => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLondon';
      model = new TSVDataModel(tsvText);
    });

    it('should add column to specific row', () => {
      model.addColumnToRow(1);
      const data = model.getData();
      
      assert.strictEqual(data[1].length, 4); // Row 1 now has 4 columns
      assert.strictEqual(data[1][3], ''); // New column is empty
      assert.strictEqual(data[2].length, 3); // Other rows unchanged
    });

    it('should remove last column from specific row', () => {
      const removed = model.removeLastColumnFromRow(1);
      const data = model.getData();
      
      assert.strictEqual(removed, true);
      assert.strictEqual(data[1].length, 2); // Row 1 now has 2 columns
      assert.deepStrictEqual(data[1], ['John', '25']); // 'New York' removed
    });

    it('should not remove last column if row has only one column', () => {
      const singleColumnModel = new TSVDataModel('Single');
      const removed = singleColumnModel.removeLastColumnFromRow(0);
      const data = singleColumnModel.getData();
      
      assert.strictEqual(removed, false);
      assert.strictEqual(data[0].length, 1); // Column preserved
    });

    it('should handle column operations on invalid row index', () => {
      model.addColumnToRow(10); // Invalid row
      const removed = model.removeLastColumnFromRow(10); // Invalid row
      
      assert.strictEqual(removed, false);
      // Model should remain unchanged
      const data = model.getData();
      assert.strictEqual(data.length, 3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle newlines at end of TSV text', () => {
      const tsvText = 'A\tB\nC\tD\n';
      const model = new TSVDataModel(tsvText);
      const data = model.getData();
      
      // Should not create extra empty row for trailing newline
      assert.strictEqual(data.length, 2);
    });

    it('should handle tabs at end of lines', () => {
      const tsvText = 'A\tB\t\nC\tD\t';
      const model = new TSVDataModel(tsvText);
      const data = model.getData();
      
      assert.strictEqual(data[0].length, 3); // Including empty cell from trailing tab
      assert.strictEqual(data[0][2], '');
    });

    it('should handle mixed empty and filled cells', () => {
      const tsvText = '\t\tC\nA\t\t\n\tB\t';
      const model = new TSVDataModel(tsvText);
      const data = model.getData();
      
      assert.strictEqual(data.length, 3);
      assert.deepStrictEqual(data[0], ['', '', 'C']);
      assert.deepStrictEqual(data[1], ['A', '', '']);
      assert.deepStrictEqual(data[2], ['', 'B', '']);
    });

    it('should maintain data integrity after multiple operations', () => {
      const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tLondon';
      const model = new TSVDataModel(tsvText);
      
      // Perform a series of operations
      model.updateCell({ position: { row: 0, col: 0 }, value: 'Modified' });
      model.insertRowAfter(1);
      model.addColumnToRow(2);
      model.deleteRow(3);
      
      const data = model.getData();
      const serialized = model.toTSV();
      
      // Should be able to reconstruct from serialized data
      const reconstructed = new TSVDataModel(serialized);
      const reconstructedData = reconstructed.getData();
      
      assert.deepStrictEqual(data, reconstructedData);
    });
  });
});
