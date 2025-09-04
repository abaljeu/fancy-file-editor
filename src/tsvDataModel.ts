// TSV Data Model Types
export interface CellPosition {
  row: number;
  col: number;
}

export interface CellEdit {
  position: CellPosition;
  value: string;
}

export type TSVTable = string[][];

// Folding-related types
export interface RowMetadata {
  indentLevel: number;
  isFolded: boolean;
  isVisible: boolean;  // New: explicit visibility state
  hasChildren: boolean;
}

export interface VisibleRowData {
  originalRowIndex: number;
  indentLevel: number;
  isFoldable: boolean;
  isFolded: boolean;
  cells: string[];
}

// TSV Data Model Functions
export class TSVDataModel {
  private data: TSVTable = [['']];
  private rowMetadata: RowMetadata[] = [];

  // Parse TSV text into 2D array
  static parseTSV(text: string): TSVTable {
    if (!text.trim()) {
      return [['']];
    }
    
    // Remove trailing newline to avoid creating empty row
    const cleanText = text.replace(/\n$/, '');
    const rows = cleanText.split('\n');
    
    return rows.map(row => {
      const cells = row.split('\t');
      return cells.length > 0 ? cells : [''];
    });
  }

  // Serialize 2D array back to TSV format
  static serializeTSV(data: TSVTable): string {
    return data.map(row => row.join('\t')).join('\n');
  }

  constructor(tsvText: string) {
    this.data = TSVDataModel.parseTSV(tsvText);
    this.initializeFoldingMetadata();
  }

  // Initialize folding metadata for all rows
  private initializeFoldingMetadata(): void {
    this.rowMetadata = [];
    
    for (let i = 0; i < this.data.length; i++) {
      const indentLevel = this.calculateIndentLevel(i);
      const hasChildren = this.checkHasChildren(i);
      
      this.rowMetadata.push({
        indentLevel,
        isFolded: false,  // Default: not folded
        isVisible: true,  // Default: visible
        hasChildren
      });
    }
  }

  /**
   * Rebuild rowMetadata while preserving existing fold states.
   * Adjust indices for insertion/deletion and reapply folds so descendants
   * remain hidden. New rows start unfolded & visible.
   */
  private reinitializePreserveFolds(change?: { insertedAt?: number; deletedAt?: number }): void {
    // Capture indices of folded rows prior to mutation
    const foldedSet: number[] = [];
    for (let i = 0; i < this.rowMetadata.length; i++) {
      if (this.rowMetadata[i].isFolded) foldedSet.push(i);
    }

    // Perform full metadata rebuild (resets visibility & hasChildren flags)
    this.initializeFoldingMetadata();

    // Adjust indices relative to structural change
    if (change?.insertedAt !== undefined) {
      for (let i = 0; i < foldedSet.length; i++) {
        if (foldedSet[i] >= change.insertedAt) foldedSet[i] += 1;
      }
    }
    if (change?.deletedAt !== undefined) {
      for (let i = 0; i < foldedSet.length; i++) {
        if (foldedSet[i] > change.deletedAt) foldedSet[i] -= 1;
        else if (foldedSet[i] === change.deletedAt) {
          // Deleted the folded row itself; remove from list
          foldedSet.splice(i, 1); i--; 
        }
      }
    }

    // Reapply fold state, ensuring descendants are hidden again
    for (const idx of foldedSet) {
      if (idx >= 0 && idx < this.rowMetadata.length) {
        // Reapply fold flag; if it no longer has children this is a no-op for visibility
        this.rowMetadata[idx].isFolded = true;
        if (this.rowMetadata[idx].hasChildren) {
          const children = this.getChildren(idx);
          for (const child of children) {
            this.hide(child);
          }
        }
      }
    }
  }

  // Calculate indent level based on leading empty cells
  private calculateIndentLevel(rowIndex: number): number {
    if (rowIndex >= this.data.length) return 0;
    
    const row = this.data[rowIndex];
    let indentLevel = 0;
    
    // Count leading empty cells as indentation, but reserve the last cell
    // as a potential data cell placeholder (so an all-empty newly inserted
    // row with N cells is treated as indent N-1, not N). This keeps a newly
    // inserted blank row after a folded parent at the parent's indent level
    // instead of being classified as a hidden child.
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '') {
        // If we're at the last cell, treat it as the data cell placeholder
        if (i === row.length - 1) {
          break;
        }
        indentLevel++;
      } else {
        break;
      }
    }
    
    return indentLevel;
  }

  // Check if a row has children (next row has higher indent level)
  private checkHasChildren(rowIndex: number): boolean {
    if (rowIndex >= this.data.length - 1) return false;
    
    const currentLevel = this.calculateIndentLevel(rowIndex);
    const nextLevel = this.calculateIndentLevel(rowIndex + 1);
    
    return nextLevel > currentLevel;
  }

  // Get current data
  getData(): TSVTable {
    return [...this.data.map(row => [...row])]; // Deep copy
  }

  // Update a single cell
  updateCell(edit: CellEdit): void {
    const { row, col } = edit.position;
    
    // Expand table if needed
    while (this.data.length <= row) {
      this.data.push(['']);
    }
    while (this.data[row].length <= col) {
      this.data[row].push('');
    }
    
    this.data[row][col] = edit.value;
  }

  // Get TSV text representation
  toTSV(): string {
    return TSVDataModel.serializeTSV(this.data);
  }

  // Get table dimensions
  getDimensions(): { rows: number; cols: number } {
    const rows = this.data.length;
    const cols = Math.max(...this.data.map(row => row.length));
    return { rows, cols };
  }

  // Insert a new row at the specified index
  insertRow(rowIndex: number): void {
    // Just insert a single empty cell (no tabs initially)
    const newRow = [''];
    this.data.splice(rowIndex, 0, newRow);
  this.reinitializePreserveFolds({ insertedAt: rowIndex });
  }

  // Insert a new row with leading tabs to match the first data column of the row above
  insertRowWithIndent(rowIndex: number): { newRowIndex: number; focusCol: number } {
    const newRowIndex = rowIndex + 1;
    
    // Find the first non-empty cell in the row above (or current row if at end)
    const referenceRowIndex = rowIndex >= 0 && rowIndex < this.data.length ? rowIndex : this.data.length - 1;
    let firstDataCol = 0;
    
    if (referenceRowIndex >= 0 && referenceRowIndex < this.data.length) {
      const referenceRow = this.data[referenceRowIndex];
      for (let i = 0; i < referenceRow.length; i++) {
        if (referenceRow[i].trim() !== '') {
          firstDataCol = i;
          break;
        }
      }
    }
    
    // Create new row with empty cells up to the first data column
    const newRow = new Array(firstDataCol + 1).fill('');
    this.data.splice(newRowIndex, 0, newRow);
  this.reinitializePreserveFolds({ insertedAt: newRowIndex });
    
    return { newRowIndex, focusCol: firstDataCol };
  }

  /**
   * Insert a new sibling row logically "after" the current visible row.
   * If the current row is folded, the new row is placed after its entire hidden subtree.
   * Returns the inserted row index and the column to focus.
   */
  insertRowAfterVisible(rowIndex: number): { newRowIndex: number; focusCol: number } {
    // Defensive clamp
    if (rowIndex < 0) { rowIndex = 0; }
    if (rowIndex >= this.data.length) { rowIndex = this.data.length - 1; }

    // If row is not folded we can reuse existing logic which inserts immediately after
    if (!this.rowMetadata[rowIndex] || !this.rowMetadata[rowIndex].isFolded) {
      return this.insertRowWithIndent(rowIndex); // already returns new row index (rowIndex+1)
    }

    // Row is folded: we must insert after its entire subtree but keep indentation of the folded row
    const baseIndent = this.rowMetadata[rowIndex].indentLevel;
    let insertionIndex = rowIndex + 1;
    while (insertionIndex < this.rowMetadata.length && this.rowMetadata[insertionIndex].indentLevel > baseIndent) {
      insertionIndex++;
    }

    // Compute first data column from the folded (reference) row
    const referenceRow = this.data[rowIndex] || [''];
    let firstDataCol = 0;
    for (let i = 0; i < referenceRow.length; i++) {
      if (referenceRow[i].trim() !== '') { firstDataCol = i; break; }
    }

    const newRow = new Array(firstDataCol + 1).fill('');
    this.data.splice(insertionIndex, 0, newRow);
  this.reinitializePreserveFolds({ insertedAt: insertionIndex });
    return { newRowIndex: insertionIndex, focusCol: firstDataCol };
  }

  // Delete row at the specified index
  deleteRow(rowIndex: number): void {
    if (this.data.length > 1 && rowIndex >= 0 && rowIndex < this.data.length) {
      this.data.splice(rowIndex, 1);
  this.reinitializePreserveFolds({ deletedAt: rowIndex });
    }
  }

  // Insert a new row after the specified row index
  insertRowAfter(rowIndex: number): void {
    this.insertRow(rowIndex + 1);
  }

  // Insert a new row before the specified row index
  insertRowBefore(rowIndex: number): void {
    this.insertRow(rowIndex);
  }

  // Add a column to a specific row
  addColumnToRow(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.data.length) {
      this.data[rowIndex].push('');
    }
  }

  // Remove the last column from a specific row (if it has more than one column)
  removeLastColumnFromRow(rowIndex: number): boolean {
    if (rowIndex >= 0 && rowIndex < this.data.length && this.data[rowIndex].length > 1) {
      this.data[rowIndex].pop();
      return true;
    }
    return false;
  }

  // Folding Operations

  // Helper: Get all children of a node
  private getChildren(rowIndex: number): number[] {
    const children: number[] = [];
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return children;
    
    const parentLevel = this.rowMetadata[rowIndex].indentLevel;
    
    for (let i = rowIndex + 1; i < this.rowMetadata.length; i++) {
      const currentLevel = this.rowMetadata[i].indentLevel;
      
      // Stop when we reach a row at the same or higher level (not a descendant)
      if (currentLevel <= parentLevel) break;
      
      // If this is a direct child (exactly one level deeper)
      if (currentLevel === parentLevel + 1) {
        children.push(i);
      }
    }
    
    return children;
  }

  // Hide(node): node.visible = false; for all children of node: Hide(child)
  private hide(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return;
    
    this.rowMetadata[rowIndex].isVisible = false;
    
    const children = this.getChildren(rowIndex);
    for (const childIndex of children) {
      this.hide(childIndex);
    }
  }

  // Show(node): node.visible = true; if (not folded) { for all children of node: Show(child); }
  private show(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return;
    
    this.rowMetadata[rowIndex].isVisible = true;
    
    if (!this.rowMetadata[rowIndex].isFolded) {
      const children = this.getChildren(rowIndex);
      for (const childIndex of children) {
        this.show(childIndex);
      }
    }
  }

  // FoldSelf(node): node.folded = true; for all children: Hide();
  private foldSelf(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return;
    
    this.rowMetadata[rowIndex].isFolded = true;
    
    const children = this.getChildren(rowIndex);
    for (const childIndex of children) {
      this.hide(childIndex);
    }
  }

  // UnfoldSelf: node.folded = false; if (node.visible) for all children: Show(child)
  private unfoldSelf(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return;
    
    this.rowMetadata[rowIndex].isFolded = false;
    
    if (this.rowMetadata[rowIndex].isVisible) {
      const children = this.getChildren(rowIndex);
      for (const childIndex of children) {
        this.show(childIndex);
      }
    }
  }

  // Public interface methods

  // Toggle fold state of a specific row
  toggleFold(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      const metadata = this.rowMetadata[rowIndex];
      if (metadata.hasChildren) {
        if (metadata.isFolded) {
          this.unfoldSelf(rowIndex);
        } else {
          this.foldSelf(rowIndex);
        }
      }
    }
  }

  // Public folding operations  
  recursiveFold(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      const metadata = this.rowMetadata[rowIndex];
      if (metadata.hasChildren) {
        // RecursiveFold(node): node.folded = true; for all children: { RecursiveFold(); Hide(); }
        metadata.isFolded = true;
        const children = this.getChildren(rowIndex);
        for (const childIndex of children) {
          this.recursiveFold(childIndex);
          this.hide(childIndex);
        }
      }
    }
  }

  recursiveUnfold(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      const metadata = this.rowMetadata[rowIndex];
      if (metadata.hasChildren) {
        // RecursiveUnfold(node): node.folded = false; if (visible) for all children: { Show(); RecursiveUnfold(); }
        metadata.isFolded = false;
        if (metadata.isVisible) {
          const children = this.getChildren(rowIndex);
          for (const childIndex of children) {
            this.show(childIndex);
            this.recursiveUnfold(childIndex);
          }
        }
      }
    }
  }

  // Get visible rows (considering fold states)
  getVisibleRows(): VisibleRowData[] {
    const visibleRows: VisibleRowData[] = [];
    
    for (let i = 0; i < this.data.length; i++) {
      if (this.rowMetadata[i].isVisible) {
        const metadata = this.rowMetadata[i];
        visibleRows.push({
          originalRowIndex: i,
          indentLevel: metadata.indentLevel,
          isFoldable: metadata.hasChildren,
          isFolded: metadata.isFolded,
          cells: [...this.data[i]]  // Copy the cell data
        });
      }
    }
    
    return visibleRows;
  }

  // Get metadata for a specific row
  getRowMetadata(rowIndex: number): RowMetadata | null {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      return { ...this.rowMetadata[rowIndex] };  // Return copy
    }
    return null;
  }

}
