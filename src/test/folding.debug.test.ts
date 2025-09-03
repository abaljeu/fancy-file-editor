import * as assert from 'assert';
import { TSVDataModel } from '../tsvDataModel';

describe('Folding Debug - foldAllDescendants', () => {
  it('should fold parent AND mark all descendants as folded', () => {
    const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
    const model = new TSVDataModel(testData);
    
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
    assert.strictEqual(parentRow?.isFolded, false, 'Parent should be unfolded');
    
    // Check that Child1 and Child2 are unfolded (they were marked as folded but now unfolded)
    const child1Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child1');
    const child2Row = visible.find(row => row.cells.filter(c => c).join(' ') === 'Child2');
    assert.strictEqual(child1Row?.isFolded, false, 'Child1 should be unfolded');
    assert.strictEqual(child2Row?.isFolded, false, 'Child2 should be unfolded');
  });

  it('should demonstrate the difference between toggleFold and foldAllDescendants', () => {
    const testData = 'Parent\n\tChild1\n\t\tGrandchild1\n\t\tGrandchild2\n\tChild2\n\t\tGrandchild3';
    const model = new TSVDataModel(testData);
    
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
    assert.strictEqual(child1Row?.isFolded, false, 'Child1 fold state unchanged by toggleFold');
    assert.strictEqual(child2Row?.isFolded, false, 'Child2 fold state unchanged by toggleFold');
  });
});