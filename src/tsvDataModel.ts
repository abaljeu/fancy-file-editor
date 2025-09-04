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

// Unified Row type (merges former RowMetadata + VisibleRowData concerns)
export interface RowData {
  originalRowIndex: number;   // Stable index within current ordering
  indentLevel: number;
  isFolded: boolean;
  isVisible: boolean;         // Explicit visibility state
  // Optional computed flags for external callers/tests. Not stored internally.
  hasChildren?: boolean;
  isFoldable?: boolean;
  cells: string[];            // Reference to underlying data row
}

// TSV Data Model Functions
export class TSVDataModel {
  private data: TSVTable = [['']];
  private rows: RowData[] = [];

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
    this.rows = [];
    for (let i = 0; i < this.data.length; i++) {
      const indentLevel = this.calculateIndentLevel(i);
      const hasChildren = this.checkHasChildren(i);
      this.rows.push({
        originalRowIndex: i,
        indentLevel,
        isFolded: false,
        isVisible: true,
        cells: this.data[i]
      });
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

  // Shared helper: compute first data column (indent width)
  private getFirstDataColumn(referenceRowIndex: number): number {
    let firstDataCol = 0;
    if (referenceRowIndex >= 0 && referenceRowIndex < this.data.length) {
      const referenceRow = this.data[referenceRowIndex];
      for (let i = 0; i < referenceRow.length; i++) {
        if (referenceRow[i].trim() !== '') { firstDataCol = i; break; }
      }
    }
    return firstDataCol;
  }


  
  /**
   * Unified insertion helper. Decides final insertion index and indentation.
   * @param baseIndex Reference row index (clamped inside)
   * @param options.position Where to insert relative to base
   * @param options.afterVisible Treat 'after' as after folded subtree if folded
   * @param options.matchIndent Derive indent from reference row's first data column
   */
  private insertUnified(baseIndex: number, options: { position: 'before' | 'after'; afterVisible?: boolean; matchIndent?: boolean }): { newRowIndex: number; focusCol: number } {
    if (this.data.length === 0) {
      return this.insertAt(0, 0);
    }
    let idx = Math.max(0, Math.min(baseIndex, this.data.length - 1));
    let insertionIndex: number;
    if (options.position === 'before') {
      insertionIndex = idx;
    } else { // after
      if (options.afterVisible && this.rows[idx] && this.rows[idx].isFolded) {
        // Skip entire folded subtree
        const baseIndent = this.rows[idx].indentLevel;
        insertionIndex = idx + 1;
        while (insertionIndex < this.rows.length && this.rows[insertionIndex].indentLevel > baseIndent) {
          insertionIndex++;
        }
      } else {
        insertionIndex = idx + 1;
      }
    }
    const focusIndentCol = options.matchIndent ? this.getFirstDataColumn(idx) : 0;
    return this.insertAt(insertionIndex, focusIndentCol);
  }

  // Shared helper: perform the actual splice + metadata preservation
  private insertAt(insertionIndex: number, firstDataCol: number): { newRowIndex: number; focusCol: number } {
    const newRow = new Array(firstDataCol + 1).fill('');
    // Insert into underlying data
    this.data.splice(insertionIndex, 0, newRow);

    // Create and insert corresponding RowData so we keep metadata in sync
    const indentLevel = this.calculateIndentLevel(insertionIndex);

    // Determine visibility: if any ancestor is folded, this new row should be hidden
    let visible = true;
    for (let i = insertionIndex - 1; i >= 0; i--) {
      if (this.rows[i].indentLevel < indentLevel) {
        if (this.rows[i].isFolded) {
          visible = false;
        }
        break;
      }
    }

    const rowData: RowData = {
      originalRowIndex: insertionIndex,
      indentLevel,
      isFolded: false,
      isVisible: visible,
      cells: this.data[insertionIndex]
    };

    // Ensure rows array exists and insert metadata at same index
    if (!this.rows) this.rows = [];
    this.rows.splice(insertionIndex, 0, rowData);

    // Update originalRowIndex for subsequent rows to reflect new ordering
    for (let i = insertionIndex + 1; i < this.rows.length; i++) {
      this.rows[i].originalRowIndex = i;
    }

    // Also update the previous row's hasChildren/isFoldable because insertion may have created
    // or removed a child relationship for the predecessor.
    const prev = insertionIndex - 1;
    if (prev >= 0 && prev < this.rows.length) {
      // nothing to store; callers compute hasChildren via checkHasChildren()
    }

    return { newRowIndex: insertionIndex, focusCol: firstDataCol };
  }

 /**
   * Insert a new sibling row logically "after" the current visible row.
   * If the current row is folded, the new row is placed after its entire hidden subtree.
   * Returns the inserted row index and the column to focus.
   */
  insertRowAfterVisible(rowIndex: number): { newRowIndex: number; focusCol: number } {
  return this.insertUnified(rowIndex, { position: 'after', afterVisible: true, matchIndent: true });
  }

  
  // Insert a new row before the specified row index
  insertRowBefore(rowIndex: number): void {
  this.insertUnified(rowIndex, { position: 'before', matchIndent: false });
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

  
  // Delete row at the specified index
  deleteRow(rowIndex: number): void {
    if (this.data.length > 1 && rowIndex >= 0 && rowIndex < this.data.length) {
      this.data.splice(rowIndex, 1);
      // Keep metadata in sync if present
      if (this.rows && rowIndex >= 0 && rowIndex < this.rows.length) {
        this.rows.splice(rowIndex, 1);
        // Update originalRowIndex for subsequent rows
        for (let i = rowIndex; i < this.rows.length; i++) {
          this.rows[i].originalRowIndex = i;
        }
      }
    }
  }

  // Folding Operations

  
  // Check if a row has children (next row has higher indent level)
  private checkHasChildren(rowIndex: number): boolean {
    if (rowIndex >= this.data.length - 1) return false;
    
    const currentLevel = this.calculateIndentLevel(rowIndex);
    const nextLevel = this.calculateIndentLevel(rowIndex + 1);
    
    return nextLevel > currentLevel;
  }


  // Helper: Get all children of a node
  private getChildren(rowIndex: number): number[] {
    const children: number[] = [];
    if (rowIndex < 0 || rowIndex >= this.rows.length) return children;
    const parentLevel = this.rows[rowIndex].indentLevel;
    for (let i = rowIndex + 1; i < this.rows.length; i++) {
      const currentLevel = this.rows[i].indentLevel;
      
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
  if (rowIndex < 0 || rowIndex >= this.rows.length) return;
  this.rows[rowIndex].isVisible = false;
    
    const children = this.getChildren(rowIndex);
    for (const childIndex of children) {
      this.hide(childIndex);
    }
  }

  // Show(node): node.visible = true; if (not folded) { for all children of node: Show(child); }
  private show(rowIndex: number): void {
  if (rowIndex < 0 || rowIndex >= this.rows.length) return;
  this.rows[rowIndex].isVisible = true;
  if (!this.rows[rowIndex].isFolded) {
      const children = this.getChildren(rowIndex);
      for (const childIndex of children) {
        this.show(childIndex);
      }
    }
  }

  // FoldSelf(node): node.folded = true; for all children: Hide();
  private foldSelf(rowIndex: number): void {
    this.recursiveFold(rowIndex, false);
  }

  // UnfoldSelf: node.folded = false; if (node.visible) for all children: Show(child)
  private unfoldSelf(rowIndex: number): void {
    this.recursiveUnfold(rowIndex, false);
  }

  // Public interface methods

  // Toggle fold state of a specific row
  toggleFold(rowIndex: number, recurse: boolean =false): void {
    if (rowIndex >= 0 && rowIndex < this.rows.length) {
      const metadata = this.rows[rowIndex];
  if (this.checkHasChildren(rowIndex)) {
        if (metadata.isFolded) {
          this.recursiveFold(rowIndex, recurse);
        } else {
          this.recursiveFold(rowIndex, recurse);
        }
      }
    }
  }

  // Public folding operations  
  recursiveFold(rowIndex: number, recurse: boolean=true): void {
    if (rowIndex >= 0 && rowIndex < this.rows.length) {
      const metadata = this.rows[rowIndex];
  if (this.checkHasChildren(rowIndex)) {
        // RecursiveFold(node): node.folded = true; for all children: { RecursiveFold(); Hide(); }
        metadata.isFolded = true;
        const children = this.getChildren(rowIndex);
        for (const childIndex of children) {
          if (recurse)
            this.recursiveFold(childIndex, recurse);
          this.hide(childIndex);
        }
      }
    }
  }

  recursiveUnfold(rowIndex: number, recurse:boolean=true): void {
    if (rowIndex >= 0 && rowIndex < this.rows.length) {
      const metadata = this.rows[rowIndex];
  if (this.checkHasChildren(rowIndex)) {
        // RecursiveUnfold(node): node.folded = false; if (visible) for all children: { Show(); RecursiveUnfold(); }
        metadata.isFolded = false;
        if (metadata.isVisible) {
          const children = this.getChildren(rowIndex);
          for (const childIndex of children) {
            this.show(childIndex);
            if (recurse)
              this.recursiveUnfold(childIndex, recurse);
          }
        }
      }
    }
  }

  // Get visible rows (considering fold states)
  getVisibleRows(): RowData[] {
    const out: RowData[] = [];
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (r.isVisible) {
        // Return shallow copy to avoid accidental external mutation
        out.push(r);
      }
    }
    return out;
  }

  // Get metadata for a specific row
  getRowMetadata(rowIndex: number): RowData | null {
    if (rowIndex >= 0 && rowIndex < this.rows.length) {
      return this.rows[rowIndex];
   }
    return null;
  }

}
