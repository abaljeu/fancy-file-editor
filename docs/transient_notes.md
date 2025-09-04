# Transient Architecture & Refactor Notes

Date: 2025-09-04

Purpose: Working scratchpad consolidating current understanding of the Fancy File Editor architecture, known mismatches/bugs, and proposed remediation steps before restructuring. This mirrors the recent assistant explanation so we can iterate directly in-repo.

---
## 1. Key Components (Current)

| Area | File | Role |
|------|------|------|
| Data Model | `src/tsvDataModel.ts` | Parses `.tsb` (tab-separated with custom semantics), holds rows + folding metadata, exposes operations (parse, serialize, fold/unfold, visibility projection) |
| Extension Activation & Provider | `src/extension.ts` | Registers custom editor provider; mediates between VS Code `TextDocument`, the model instance, and the webview; handles message dispatch; rewrites document text on edits |
| Webview UI | `media/webview.html`, `media/table.css` | Renders visible rows as an HTML table with custom cell inputs, sends edit & folding messages back to extension |
| Tests (logic + folding) | `src/test/*.test.ts` | Exercise parsing, workflows, folding visibility rules; do not cover full provider/webview integration |
| Docs (intent) | `docs/overview.md`, `docs/plans.md` | High-level intent; architecture drift vs actual code not always reconciled |

Notes:
* Rendering is NOT the standard VS Code text editor; it's a custom table-like interface.
* Folding implemented logically (hide descendant rows) rather than leveraging VS Code's native folding ranges.
* Editing strategy = full document replacement each mutation (simplifies sync; not efficient long-term).

---
## 2. Model Responsibilities (Observed)

1. Parse raw text -> internal row array (each row = cells[], indentation, possibly inferred hierarchy)
2. Maintain `rowMetadata[]` with:
	 * `indentLevel`
	 * `hasChildren`
	 * `isFolded`
	 * `isVisible` (derived)
3. Folding operations:
	 * `foldSelf(rowIndex)` / `unfoldSelf` (affects direct descendants' visibility)
	 * `recursiveFold(rowIndex)` / `recursiveUnfold` (deep)
	 * `toggleFold(rowIndex)` (non-recursive?)
4. Projection: `getVisibleRows()` returns rows for UI consumption (with original indices, etc.)
5. Serialization back to text when persisting to VS Code document.

Pain Points:
* Fold state restoration after metadata recalculation is index-based and incomplete (descendants reappear; identity can shift).
* Partial semantic mismatch between recursive vs non-recursive fold operations and UI naming.

---
## 3. Provider (Message Bridge) Gaps

Current message types handled (legacy mismatch resolved):
* `unfold` action previously reused `toggleFold`; will be updated to explicit recursive unfold (pending implementation step).

Full-document replace logic uses a large `Range(0,0,lineCount,0)`. Works but less explicit than using document end position by offset.

---
## 4. Webview UI Issues & Performance Strategy

**New Incremental Update Architecture (UID-based)**:

### Core Principle
- **Model**: Sequence of ALL rows, some marked `isVisible: true/false`
- **View**: Displays sequence of VISIBLE rows only, same order as model
- **Identity**: Each row has stable UID for tracking across operations
- **Batching**: Operations that affect multiple rows send batch updates

### UID Strategy
```typescript
// In RowData interface - add:
interface RowData {
  uid: string;                    // Stable identifier (uuid or hash-based)
  originalRowIndex: number;       // Current position in model
  indentLevel: number;
  isFolded: boolean;
  isVisible: boolean;
  cells: string[];
}
```

### Batch Update Messages
```typescript
// Remove multiple rows (fold, delete operations)
{
  type: 'removeRows',
  data: { uids: string[] }
}

// Insert rows after anchor (unfold, insert operations)  
{
  type: 'insertRowsAfter',
  data: { 
    anchorUID: string,           // Existing visible row (or null for prepend)
    newRows: RowData[]           // Rows to insert in sequence
  }
}

// Update existing row content (cell edits)
{
  type: 'updateRows', 
  data: { rows: {uid: string, cells: string[]}[] }
}
```

### View-Side Implementation
```javascript
// In webview.js
const rowElementsByUID = new Map();  // uid -> HTMLTableRowElement
const cellElementsByUID = new Map(); // uid -> Map<colIndex, HTMLInputElement>

function handleRemoveRows(uids) {
  uids.forEach(uid => {
    const rowElement = rowElementsByUID.get(uid);
    if (rowElement) {
      rowElement.remove();
      rowElementsByUID.delete(uid);
      cellElementsByUID.delete(uid);
    }
  });
}

function handleInsertRowsAfter(anchorUID, newRows) {
  const anchorElement = rowElementsByUID.get(anchorUID);
  const insertPoint = anchorElement ? anchorElement.nextSibling : tableBody.firstChild;
  
  newRows.forEach(rowData => {
    const rowElement = createRowElement(rowData);
    tableBody.insertBefore(rowElement, insertPoint);
    rowElementsByUID.set(rowData.uid, rowElement);
    // ... populate cellElementsByUID
  });
}
```

### Benefits
- **Fold operation**: One `removeRows` message with all descendant UIDs
- **Unfold operation**: One `insertRowsAfter` message with all newly visible rows
- **Insert/Delete**: Precise positioning without index recalculation
- **Performance**: Only touches affected DOM elements

---
## 5. Implementation Steps for UID Architecture

### Step 1: Add UID to Model
```typescript
// In tsvDataModel.ts
private generateUID(): string {
  return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Update initializeFoldingMetadata() to assign UIDs
// Update insertAt() to assign UID to new rows
```

### Step 2: View UID Tracking
```javascript
// In webview.js - replace current row tracking
const rowElementsByUID = new Map();
const visibleRowOrder = []; // Array of UIDs in display order
```

### Step 3: Batch Change Detection
```typescript
// In tsvDataModel.ts - add change tracking
private pendingChanges: {
  removedUIDs: Set<string>;
  insertedAfter: Map<string|null, RowData[]>;
  updatedRows: Map<string, RowData>;
} = { removedUIDs: new Set(), insertedAfter: new Map(), updatedRows: new Map() };

// Collect changes during operations, flush at end
```

### Step 4: Extension Bridge Updates
```typescript
// In extension.ts - replace single refresh with batched updates
private flushModelChanges(model: TSVDataModel) {
  const changes = model.getAndClearPendingChanges();
  webviewPanel.webview.postMessage({
    type: 'batchUpdate',
    data: changes
  });
}
```

---

## 6. Folding Logic Problems (Detail) - SUPERSEDED BY UID ARCHITECTURE

**OLD ISSUES** (solved by UID approach):

| Problem | Effect | UID Solution |
|---------|--------|--------------|
| `updateFoldingMetadata()` re-applies `isFolded` flags but doesn't re-hide descendants | Collapsed nodes visually expand after structural changes | UIDs maintain identity across structural changes |
| Index-based fold restoration | Wrong rows can be marked folded after insert/delete | UIDs provide stable identity |
| Mixed semantics (toggle vs recursive) | User confusion / inconsistent test expectations | Clear batch operations with explicit scope |

**NEW APPROACH**: 
- Fold operations change `isVisible` flags in model
- Model batches all affected UIDs 
- Single `removeRows` message to view
- No index recalculation needed

---

## 7. Minimal Remediation Plan (Phase 1) - UPDATED

Goal: Implement UID-based architecture for stable performance.

**Priority Order:**
1. **Add UID to RowData interface and model operations**
2. **Implement view-side UID tracking and batch update handlers** 
3. **Update extension bridge to send batch messages**
4. **Replace current full-refresh with incremental updates**
5. Fix Tab navigation to use UIDs (was: `data-original-row`)
6. Context menu operations use batch updates

---
## 7. Proposed Code Changes (Draft – Not Applied Yet)

// (Removed) Back-compat handler for deprecated foldAllDescendants message.

Model `updateFoldingMetadata()` adjustment:
```ts
oldFoldStates.forEach((isFolded, rowIndex) => {
	if (rowIndex < this.rowMetadata.length && this.rowMetadata[rowIndex].hasChildren) {
		if (isFolded) {
			this.foldSelf(rowIndex); // ensures descendants hidden
		}
	}
});
```

Webview Tab navigation fix:
```js
const currentRow = document.querySelector(`tr[data-original-row="${rowIndex}"]`);
```

Context menu explicit unfold:
```js
vscode.postMessage({
	type: 'recursiveFold',
	data: { rowIndex: contextMenuRow, folded: false }
});
```

---
## 8. Open Design Decisions (Need Agreement)

2. Identity for Fold Persistence: Accept index-based interim solution, or implement stable hash (e.g., `indent + firstCell + childCount`) now?
3. Message Vocabulary: Standardize on verbs (e.g., `foldNode`, `unfoldNode`, `foldSubtree`, `unfoldSubtree`) vs overloading `recursiveFold` with a boolean.
4. Keep both granular (`foldSelf`) and recursive operations.
5. Performance Strategy: Stay with whole-document rewrite until diffing becomes a bottleneck, or prototype incremental sync early?

---
## 9. Suggested Phase Sequencing

Phase 1 (Stabilize): Implement minimal remediation plan (items 1–4 above) + tests for: (a) fold restoration after edit; (b) context menu operations; (c) tab navigation with folded rows.

Phase 2 (Identity & API Cleanup): Introduce stable row IDs, refactor message names, unify recursive vs non-recursive semantics, adjust tests.

Phase 3 (Performance & UX): Incremental document updates, selection persistence across rerenders, keyboard shortcuts for folding.

Phase 4 (Extensibility): Plug-in style render adapters for other file types (convert to internal TSV-like model), richer cell editing widgets.

---
## 10. Test Gaps to Add

| Scenario | New Test Idea |
|----------|---------------|
| Fold state survives insertion above folded block | Create model, fold a row, insert new row before it, re-run metadata update, assert visibility |
| Webview arrow navigation with folded rows | Ensure Up/Down skip hidden rows |
| Webview Tab navigation with folded rows | Ensure tab stays within visible row and uses data-original-row |
| Context menu explicit unfold | Force-fold row recursively, send "unfold" message, assert all descendants visible |
| (Dropped) Legacy alias test | No longer needed |

---
## 11. Risks / Tradeoffs

| Decision | Risk | Mitigation |
|----------|------|-----------|
| Keep index-based fold restoration temporarily | Wrong mapping after complex edits | Phase 2 identity system |
| Add alias handlers (naming drift) | Temporary API clutter | Consolidate after tests green |
| Recompute visibility via foldSelf calls | Slight O(n^2) worst-case on many folded nodes | Accept for current data sizes; optimize later |

---
## 12. Next Immediate Actions (Once Approved)

1. Apply code patches (extension, model, webview).
2. Add/adjust unit tests for folding restoration & message handling.
3. Document message contract (`docs/architecture.md` update section: Messaging Protocol).
4. Decide on semantics for "Fold All Descendants" (see Open Decision #1) – REQUIRED before finalizing tests.

---

## 13. Questions for Confirmation - UPDATED FOR UID ARCHITECTURE

Please clarify:

* **Q1**: Proceed with UID-based batch update architecture as outlined above (YES/NO)?
* **Q2**: UID generation strategy - use `Date.now() + random()` or content-based hash (simpler vs stable across reloads)?
* **Q3**: Implement all 4 steps of UID architecture in one phase, or break into sub-phases?

**NEW DECISIONS NEEDED**:
* **Q4**: Should fold operations send incremental updates immediately, or batch them until operation completes?
* **Q5**: How to handle initial table population - still send full `init` message or use `insertRowsAfter` with `anchorUID: null`?

Add answers below, then we execute UID implementation.

---
## 14. Scratch / Notes

*(Use this section for ad hoc thoughts during implementation; prune before committing a polished doc.)*

---
End of transient notes.
