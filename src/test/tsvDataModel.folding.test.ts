import * as assert from 'assert';
import { TSVDataModel } from '../tsvDataModel';

describe('TSVDataModel - Folding Features', () => {
  
  describe('Hierarchy Detection', () => {
    it('should detect indentation levels correctly', () => {
      const testData = 'Name\tAge\tCity\n\tJohn\t25\tNew York\n\t\tGood\n\t\texcellent\n\tJane\t30\tLondon\nSection\tHeader\tInfo';
      const model = new TSVDataModel(testData);
      
      const visibleRows = model.getVisibleRows();
      
      // Check indentation levels
      assert.strictEqual(visibleRows[0].indentLevel, 0); // Name Age City
      assert.strictEqual(visibleRows[1].indentLevel, 1); // John 25 New York
      assert.strictEqual(visibleRows[2].indentLevel, 2); // Good
      assert.strictEqual(visibleRows[3].indentLevel, 2); // excellent
      assert.strictEqual(visibleRows[4].indentLevel, 1); // Jane 30 London
      assert.strictEqual(visibleRows[5].indentLevel, 0); // Section Header Info
    });

    it('should detect foldable rows correctly', () => {
      const testData = 'Name\tAge\tCity\n\tJohn\t25\tNew York\n\t\tGood\n\t\texcellent\n\tJane\t30\tLondon\nSection\tHeader\tInfo';
      const model = new TSVDataModel(testData);
      
      const visibleRows = model.getVisibleRows();
      
      // Check foldable status
      assert.strictEqual(visibleRows[0].isFoldable, true);  // Name has children
      assert.strictEqual(visibleRows[1].isFoldable, true);  // John has children
      assert.strictEqual(visibleRows[2].isFoldable, false); // Good has no children
      assert.strictEqual(visibleRows[3].isFoldable, false); // excellent has no children
      assert.strictEqual(visibleRows[4].isFoldable, false); // Jane has no children
      assert.strictEqual(visibleRows[5].isFoldable, false); // Section has no children
    });
  });

  describe('Basic Folding Operations', () => {
    it('should toggle fold state correctly', () => {
      const testData = 'Name\tAge\tCity\n\tJohn\t25\tNew York\n\t\tGood\n\t\texcellent\n\tJane\t30\tLondon';
      const model = new TSVDataModel(testData);
      
      // Initially all visible
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 5);
      
      // Fold John's row (should hide Good and excellent)
      model.toggleFold(1);
      visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 3); // Name, John, Jane
      assert.strictEqual(visibleRows[1].isFolded, true);
      
      // Unfold John's row (should show Good and excellent again)
      model.toggleFold(1);
      visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 5);
      assert.strictEqual(visibleRows[1].isFolded, false);
    });

    it('should hide all descendants when folding', () => {
      const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
      const model = new TSVDataModel(testData);
      
      // Initially all visible
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 6);
      
      // Fold Parent (should hide all children and grandchildren)
      model.toggleFold(0);
      visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 1); // Only Parent
    });
  });

  describe('Fold All Descendants', () => {
    it('should fold all descendants recursively', () => {
      const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
      const model = new TSVDataModel(testData);
      
      // Fold all descendants
      model.foldAllDescendants(0, true);
      
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 3); // Parent, Child1, Child2
      
      // Check that all foldable descendants are folded
      assert.strictEqual(visibleRows[0].isFolded, true); // Parent
      assert.strictEqual(visibleRows[1].isFolded, true); // Child1
      assert.strictEqual(visibleRows[2].isFolded, true); // Child2
    });

    it('should unfold all descendants recursively', () => {
      const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
      const model = new TSVDataModel(testData);
      
      // First fold all
      model.foldAllDescendants(0, true);
      
      // Then unfold all
      model.foldAllDescendants(0, false);
      
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 6); // All rows visible
      
      // Check that all descendants are unfolded
      assert.strictEqual(visibleRows[0].isFolded, false); // Parent
      assert.strictEqual(visibleRows[1].isFoldable, true); // Child1 is foldable
      assert.strictEqual(visibleRows[1].isFolded, false); // Child1 is unfolded
      assert.strictEqual(visibleRows[4].isFoldable, true); // Child2 is foldable  
      assert.strictEqual(visibleRows[4].isFolded, false); // Child2 is unfolded
    });
  });

  describe('Complex Folding Scenarios', () => {
    it('should handle partial folding correctly', () => {
      const testData = 'Root\n\tSection1\n\t\tItem1\n\t\tItem2\n\tSection2\n\t\tItem3\n\t\tItem4';
      const model = new TSVDataModel(testData);
      
      // Fold Section1 only
      model.toggleFold(1);
      
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 5); // Root, Section1, Section2, Item3, Item4
      
      // Check that Section2's children are still visible
      const section2Index = visibleRows.findIndex(row => row.cells[0].trim() === 'Section2');
      assert.strictEqual(visibleRows[section2Index + 1].cells[0].trim(), 'Item3');
      assert.strictEqual(visibleRows[section2Index + 2].cells[0].trim(), 'Item4');
    });

    it('should maintain fold states after data modifications', () => {
      const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\tChild2\n\t\tGrandchild2';
      const model = new TSVDataModel(testData);
      
      // Fold Child1
      model.toggleFold(1);
      
      // Insert a new row
      model.insertRow(2);
      
      // Check that Child1 is still folded after insertion
      let visibleRows = model.getVisibleRows();
      const child1Row = visibleRows.find(row => row.cells[0].trim() === 'Child1');
      assert.strictEqual(child1Row?.isFolded, true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle folding non-foldable rows gracefully', () => {
      const testData = 'Item1\nItem2\nItem3';
      const model = new TSVDataModel(testData);
      
      // Try to fold a row with no children
      model.toggleFold(1);
      
      // Should have no effect
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 3);
      assert.strictEqual(visibleRows[1].isFolded, false);
    });

    it('should handle empty data gracefully', () => {
      const model = new TSVDataModel('');
      
      model.toggleFold(0);
      
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 1);
    });

    it('should handle single row data', () => {
      const testData = 'SingleRow';
      const model = new TSVDataModel(testData);
      
      model.toggleFold(0);
      
      let visibleRows = model.getVisibleRows();
      assert.strictEqual(visibleRows.length, 1);
      assert.strictEqual(visibleRows[0].isFoldable, false);
    });
  });
});
