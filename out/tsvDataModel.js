"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSVDataModel = void 0;
// TSV Data Model Functions
class TSVDataModel {
    // Parse TSV text into 2D array
    static parseTSV(text) {
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
    static serializeTSV(data) {
        return data.map(row => row.join('\t')).join('\n');
    }
    constructor(tsvText) {
        this.data = [['']];
        this.rowMetadata = [];
        this.data = TSVDataModel.parseTSV(tsvText);
        this.initializeFoldingMetadata();
    }
    // Initialize folding metadata for all rows
    initializeFoldingMetadata() {
        this.rowMetadata = [];
        for (let i = 0; i < this.data.length; i++) {
            const indentLevel = this.calculateIndentLevel(i);
            const hasChildren = this.checkHasChildren(i);
            this.rowMetadata.push({
                indentLevel,
                isFolded: false,
                isVisible: true,
                hasChildren
            });
        }
    }
    // Calculate indent level based on leading empty cells
    calculateIndentLevel(rowIndex) {
        if (rowIndex >= this.data.length)
            return 0;
        const row = this.data[rowIndex];
        let indentLevel = 0;
        // Count leading empty cells as indentation
        for (let i = 0; i < row.length; i++) {
            if (row[i] === '') {
                indentLevel++;
            }
            else {
                break;
            }
        }
        return indentLevel;
    }
    // Check if a row has children (next row has higher indent level)
    checkHasChildren(rowIndex) {
        if (rowIndex >= this.data.length - 1)
            return false;
        const currentLevel = this.calculateIndentLevel(rowIndex);
        const nextLevel = this.calculateIndentLevel(rowIndex + 1);
        return nextLevel > currentLevel;
    }
    // Get current data
    getData() {
        return [...this.data.map(row => [...row])]; // Deep copy
    }
    // Update a single cell
    updateCell(edit) {
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
    toTSV() {
        return TSVDataModel.serializeTSV(this.data);
    }
    // Get table dimensions
    getDimensions() {
        const rows = this.data.length;
        const cols = Math.max(...this.data.map(row => row.length));
        return { rows, cols };
    }
    // Insert a new row at the specified index
    insertRow(rowIndex) {
        // Just insert a single empty cell (no tabs initially)
        const newRow = [''];
        this.data.splice(rowIndex, 0, newRow);
        this.updateFoldingMetadata();
    }
    // Insert a new row with leading tabs to match the first data column of the row above
    insertRowWithIndent(rowIndex) {
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
    deleteRow(rowIndex) {
        if (this.data.length > 1 && rowIndex >= 0 && rowIndex < this.data.length) {
            this.data.splice(rowIndex, 1);
            this.updateFoldingMetadata();
        }
    }
    // Insert a new row after the specified row index
    insertRowAfter(rowIndex) {
        this.insertRow(rowIndex + 1);
    }
    // Insert a new row before the specified row index
    insertRowBefore(rowIndex) {
        this.insertRow(rowIndex);
    }
    // Add a column to a specific row
    addColumnToRow(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.data.length) {
            this.data[rowIndex].push('');
        }
    }
    // Remove the last column from a specific row (if it has more than one column)
    removeLastColumnFromRow(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.data.length && this.data[rowIndex].length > 1) {
            this.data[rowIndex].pop();
            return true;
        }
        return false;
    }
    // Folding Operations
    // Helper: Get all children of a node
    getChildren(rowIndex) {
        const children = [];
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return children;
        const parentLevel = this.rowMetadata[rowIndex].indentLevel;
        for (let i = rowIndex + 1; i < this.rowMetadata.length; i++) {
            const currentLevel = this.rowMetadata[i].indentLevel;
            // Stop when we reach a row at the same or higher level (not a descendant)
            if (currentLevel <= parentLevel)
                break;
            // If this is a direct child (exactly one level deeper)
            if (currentLevel === parentLevel + 1) {
                children.push(i);
            }
        }
        return children;
    }
    // Hide(node): node.visible = false; for all children of node: Hide(child)
    hide(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return;
        this.rowMetadata[rowIndex].isVisible = false;
        const children = this.getChildren(rowIndex);
        for (const childIndex of children) {
            this.hide(childIndex);
        }
    }
    // Show(node): node.visible = true; if (not folded) { for all children of node: Show(child); }
    show(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return;
        this.rowMetadata[rowIndex].isVisible = true;
        if (!this.rowMetadata[rowIndex].isFolded) {
            const children = this.getChildren(rowIndex);
            for (const childIndex of children) {
                this.show(childIndex);
            }
        }
    }
    // FoldSelf(node): node.folded = true; for all children: Hide();
    foldSelf(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return;
        this.rowMetadata[rowIndex].isFolded = true;
        const children = this.getChildren(rowIndex);
        for (const childIndex of children) {
            this.hide(childIndex);
        }
    }
    // UnfoldSelf: node.folded = false; if (node.visible) for all children: Show(child)
    unfoldSelf(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return;
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
    toggleFold(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
            const metadata = this.rowMetadata[rowIndex];
            if (metadata.hasChildren) {
                if (metadata.isFolded) {
                    this.unfoldSelf(rowIndex);
                }
                else {
                    this.foldSelf(rowIndex);
                }
            }
        }
    }
    // Public folding operations  
    recursiveFold(rowIndex) {
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
    recursiveUnfold(rowIndex) {
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
    getVisibleRows() {
        const visibleRows = [];
        for (let i = 0; i < this.data.length; i++) {
            if (this.rowMetadata[i].isVisible) {
                const metadata = this.rowMetadata[i];
                visibleRows.push({
                    originalRowIndex: i,
                    indentLevel: metadata.indentLevel,
                    isFoldable: metadata.hasChildren,
                    isFolded: metadata.isFolded,
                    cells: [...this.data[i]] // Copy the cell data
                });
            }
        }
        return visibleRows;
    }
    // Get metadata for a specific row
    getRowMetadata(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
            return { ...this.rowMetadata[rowIndex] }; // Return copy
        }
        return null;
    }
    // Re-calculate folding metadata (call after data changes)
    updateFoldingMetadata() {
        // Preserve existing fold states where possible
        const oldFoldStates = new Map();
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
exports.TSVDataModel = TSVDataModel;
//# sourceMappingURL=tsvDataModel.js.map