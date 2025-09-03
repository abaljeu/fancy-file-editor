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
        hasChildren
      });
    }
  }

  // Calculate indent level based on leading empty cells
  private calculateIndentLevel(rowIndex: number): number {
    if (rowIndex >= this.data.length) return 0;
    
    const row = this.data[rowIndex];
    let indentLevel = 0;
    
    // Count leading empty cells as indentation
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '') {
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
    this.updateFoldingMetadata();
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
    
    return { newRowIndex, focusCol: firstDataCol };
  }

  // Delete row at the specified index
  deleteRow(rowIndex: number): void {
    if (this.data.length > 1 && rowIndex >= 0 && rowIndex < this.data.length) {
      this.data.splice(rowIndex, 1);
      this.updateFoldingMetadata();
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

  // Toggle fold state of a specific row
  toggleFold(rowIndex: number): void {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      const metadata = this.rowMetadata[rowIndex];
      if (metadata.hasChildren) {
        metadata.isFolded = !metadata.isFolded;
      }
    }
  }

  // Set fold state of a row and all its descendants
  foldAllDescendants(rowIndex: number, folded: boolean): void {
    if (rowIndex < 0 || rowIndex >= this.rowMetadata.length) return;
    
    const parentLevel = this.rowMetadata[rowIndex].indentLevel;
    
    // Mark the parent as folded (but don't actually fold it yet - that affects visibility later)
    if (this.rowMetadata[rowIndex].hasChildren) {
      this.rowMetadata[rowIndex].isFolded = folded;
    }
    
    // Mark all descendants as folded
    for (let i = rowIndex + 1; i < this.rowMetadata.length; i++) {
      const currentLevel = this.rowMetadata[i].indentLevel;
      
      // Stop when we reach a row at the same or higher level (not a descendant)
      if (currentLevel <= parentLevel) break;
      
      // Set fold state for this descendant if it has children
      if (this.rowMetadata[i].hasChildren) {
        this.rowMetadata[i].isFolded = folded;
      }
    }
  }

  // Get visible rows (considering fold states)
  getVisibleRows(): VisibleRowData[] {
    const visibleRows: VisibleRowData[] = [];
    
    for (let i = 0; i < this.data.length; i++) {
      if (this.isRowVisible(i)) {
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

  // Check if a row should be visible (not hidden by any folded ancestor)
  private isRowVisible(rowIndex: number): boolean {
    let currentLevel = this.rowMetadata[rowIndex].indentLevel;
    
    // Check all potential ancestors (rows with lower indent levels above this one)
    for (let i = rowIndex - 1; i >= 0; i--) {
      const ancestorLevel = this.rowMetadata[i].indentLevel;
      
      // If we find a row with lower indent level, it's a potential ancestor
      if (ancestorLevel < currentLevel) {
        // If this ancestor is folded, then current row is hidden
        if (this.rowMetadata[i].isFolded) {
          return false;
        }
        // Update current level to continue checking higher-level ancestors
        currentLevel = ancestorLevel;
      }
    }
    
    return true;  // No folded ancestors found
  }

  // Get metadata for a specific row
  getRowMetadata(rowIndex: number): RowMetadata | null {
    if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
      return { ...this.rowMetadata[rowIndex] };  // Return copy
    }
    return null;
  }

  // Re-calculate folding metadata (call after data changes)
  updateFoldingMetadata(): void {
    // Preserve existing fold states where possible
    const oldFoldStates = new Map<number, boolean>();
    this.rowMetadata.forEach((metadata, index) => {
      if (metadata.isFolded) {
        oldFoldStates.set(index, true);
      }
    });
    
    // Recalculate metadata
    this.initializeFoldingMetadata();
    
    // Restore fold states where the row still exists and has children
    oldFoldStates.forEach((isFolded, rowIndex) => {
      if (rowIndex < this.rowMetadata.length && this.rowMetadata[rowIndex].hasChildren) {
        this.rowMetadata[rowIndex].isFolded = isFolded;
      }
    });
  }
}
