"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.TSVDataModel = void 0;
// TSV Data Model Functions
var TSVDataModel = /** @class */ (function () {
    function TSVDataModel(tsvText) {
        this.data = [['']];
        this.rowMetadata = [];
        this.data = TSVDataModel.parseTSV(tsvText);
        this.initializeFoldingMetadata();
    }
    // Parse TSV text into 2D array
    TSVDataModel.parseTSV = function (text) {
        if (!text.trim()) {
            return [['']];
        }
        // Remove trailing newline to avoid creating empty row
        var cleanText = text.replace(/\n$/, '');
        var rows = cleanText.split('\n');
        return rows.map(function (row) {
            var cells = row.split('\t');
            return cells.length > 0 ? cells : [''];
        });
    };
    // Serialize 2D array back to TSV format
    TSVDataModel.serializeTSV = function (data) {
        return data.map(function (row) { return row.join('\t'); }).join('\n');
    };
    // Initialize folding metadata for all rows
    TSVDataModel.prototype.initializeFoldingMetadata = function () {
        this.rowMetadata = [];
        for (var i = 0; i < this.data.length; i++) {
            var indentLevel = this.calculateIndentLevel(i);
            var hasChildren = this.checkHasChildren(i);
            this.rowMetadata.push({
                indentLevel: indentLevel,
                isFolded: false,
                hasChildren: hasChildren
            });
        }
    };
    // Calculate indent level based on leading whitespace in first cell
    TSVDataModel.prototype.calculateIndentLevel = function (rowIndex) {
        if (rowIndex >= this.data.length)
            return 0;
        var firstCell = this.data[rowIndex][0] || '';
        var indentLevel = 0;
        for (var i = 0; i < firstCell.length; i++) {
            if (firstCell[i] === '\t') {
                indentLevel++;
            }
            else if (firstCell[i] === ' ') {
                // Treat 2 spaces as one indent level
                if (i + 1 < firstCell.length && firstCell[i + 1] === ' ') {
                    indentLevel++;
                    i++; // Skip the next space
                }
            }
            else {
                break;
            }
        }
        return indentLevel;
    };
    // Check if a row has children (next row has higher indent level)
    TSVDataModel.prototype.checkHasChildren = function (rowIndex) {
        if (rowIndex >= this.data.length - 1)
            return false;
        var currentLevel = this.calculateIndentLevel(rowIndex);
        var nextLevel = this.calculateIndentLevel(rowIndex + 1);
        return nextLevel > currentLevel;
    };
    // Get current data
    TSVDataModel.prototype.getData = function () {
        return __spreadArray([], this.data.map(function (row) { return __spreadArray([], row, true); }), true); // Deep copy
    };
    // Update a single cell
    TSVDataModel.prototype.updateCell = function (edit) {
        var _a = edit.position, row = _a.row, col = _a.col;
        // Expand table if needed
        while (this.data.length <= row) {
            this.data.push(['']);
        }
        while (this.data[row].length <= col) {
            this.data[row].push('');
        }
        this.data[row][col] = edit.value;
    };
    // Get TSV text representation
    TSVDataModel.prototype.toTSV = function () {
        return TSVDataModel.serializeTSV(this.data);
    };
    // Get table dimensions
    TSVDataModel.prototype.getDimensions = function () {
        var rows = this.data.length;
        var cols = Math.max.apply(Math, this.data.map(function (row) { return row.length; }));
        return { rows: rows, cols: cols };
    };
    // Insert a new row at the specified index
    TSVDataModel.prototype.insertRow = function (rowIndex) {
        // Just insert a single empty cell (no tabs initially)
        var newRow = [''];
        this.data.splice(rowIndex, 0, newRow);
        this.updateFoldingMetadata();
    };
    // Insert a new row with leading tabs to match the first data column of the row above
    TSVDataModel.prototype.insertRowWithIndent = function (rowIndex) {
        var newRowIndex = rowIndex + 1;
        // Find the first non-empty cell in the row above (or current row if at end)
        var referenceRowIndex = rowIndex >= 0 && rowIndex < this.data.length ? rowIndex : this.data.length - 1;
        var firstDataCol = 0;
        if (referenceRowIndex >= 0 && referenceRowIndex < this.data.length) {
            var referenceRow = this.data[referenceRowIndex];
            for (var i = 0; i < referenceRow.length; i++) {
                if (referenceRow[i].trim() !== '') {
                    firstDataCol = i;
                    break;
                }
            }
        }
        // Create new row with empty cells up to the first data column
        var newRow = new Array(firstDataCol + 1).fill('');
        this.data.splice(newRowIndex, 0, newRow);
        return { newRowIndex: newRowIndex, focusCol: firstDataCol };
    };
    // Delete row at the specified index
    TSVDataModel.prototype.deleteRow = function (rowIndex) {
        if (this.data.length > 1 && rowIndex >= 0 && rowIndex < this.data.length) {
            this.data.splice(rowIndex, 1);
            this.updateFoldingMetadata();
        }
    };
    // Insert a new row after the specified row index
    TSVDataModel.prototype.insertRowAfter = function (rowIndex) {
        this.insertRow(rowIndex + 1);
    };
    // Insert a new row before the specified row index
    TSVDataModel.prototype.insertRowBefore = function (rowIndex) {
        this.insertRow(rowIndex);
    };
    // Add a column to a specific row
    TSVDataModel.prototype.addColumnToRow = function (rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.data.length) {
            this.data[rowIndex].push('');
        }
    };
    // Remove the last column from a specific row (if it has more than one column)
    TSVDataModel.prototype.removeLastColumnFromRow = function (rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.data.length && this.data[rowIndex].length > 1) {
            this.data[rowIndex].pop();
            return true;
        }
        return false;
    };
    // Folding Operations
    // Toggle fold state of a specific row
    TSVDataModel.prototype.toggleFold = function (rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
            var metadata = this.rowMetadata[rowIndex];
            if (metadata.hasChildren) {
                metadata.isFolded = !metadata.isFolded;
            }
        }
    };
    // Set fold state of a row and all its descendants
    TSVDataModel.prototype.foldAllDescendants = function (rowIndex, folded) {
        if (rowIndex < 0 || rowIndex >= this.rowMetadata.length)
            return;
        var parentLevel = this.rowMetadata[rowIndex].indentLevel;
        // Fold/unfold the parent row if it has children
        if (this.rowMetadata[rowIndex].hasChildren) {
            this.rowMetadata[rowIndex].isFolded = folded;
        }
        // Fold/unfold all descendants
        for (var i = rowIndex + 1; i < this.rowMetadata.length; i++) {
            var currentLevel = this.rowMetadata[i].indentLevel;
            // Stop when we reach a row at the same or higher level (not a descendant)
            if (currentLevel <= parentLevel)
                break;
            // Set fold state for this descendant if it has children
            if (this.rowMetadata[i].hasChildren) {
                this.rowMetadata[i].isFolded = folded;
            }
        }
    };
    // Get visible rows (considering fold states)
    TSVDataModel.prototype.getVisibleRows = function () {
        var visibleRows = [];
        for (var i = 0; i < this.data.length; i++) {
            if (this.isRowVisible(i)) {
                var metadata = this.rowMetadata[i];
                visibleRows.push({
                    originalRowIndex: i,
                    indentLevel: metadata.indentLevel,
                    isFoldable: metadata.hasChildren,
                    isFolded: metadata.isFolded,
                    cells: __spreadArray([], this.data[i], true) // Copy the cell data
                });
            }
        }
        return visibleRows;
    };
    // Check if a row should be visible (not hidden by any folded ancestor)
    TSVDataModel.prototype.isRowVisible = function (rowIndex) {
        var currentLevel = this.rowMetadata[rowIndex].indentLevel;
        // Check all potential ancestors (rows with lower indent levels above this one)
        for (var i = rowIndex - 1; i >= 0; i--) {
            var ancestorLevel = this.rowMetadata[i].indentLevel;
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
        return true; // No folded ancestors found
    };
    // Get metadata for a specific row
    TSVDataModel.prototype.getRowMetadata = function (rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.rowMetadata.length) {
            return __assign({}, this.rowMetadata[rowIndex]); // Return copy
        }
        return null;
    };
    // Re-calculate folding metadata (call after data changes)
    TSVDataModel.prototype.updateFoldingMetadata = function () {
        var _this = this;
        // Preserve existing fold states where possible
        var oldFoldStates = new Map();
        this.rowMetadata.forEach(function (metadata, index) {
            if (metadata.isFolded) {
                oldFoldStates.set(index, true);
            }
        });
        // Recalculate metadata
        this.initializeFoldingMetadata();
        // Restore fold states where the row still exists and has children
        oldFoldStates.forEach(function (isFolded, rowIndex) {
            if (rowIndex < _this.rowMetadata.length && _this.rowMetadata[rowIndex].hasChildren) {
                _this.rowMetadata[rowIndex].isFolded = isFolded;
            }
        });
    };
    return TSVDataModel;
}());
exports.TSVDataModel = TSVDataModel;
