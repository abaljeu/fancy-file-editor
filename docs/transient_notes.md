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

Current message types handled exclude some actually emitted by the webview. Specifically:
* Webview uses `foldAllDescendants` (context menu) → Provider does NOT handle it (expects `recursiveFold`). No-op bug.
* `unfold` action in context menu reuses `toggleFold`, which may re-fold depending on existing state (not idempotent).

Full-document replace logic uses a large `Range(0,0,lineCount,0)`. Works but less explicit than using document end position by offset.

---
## 4. Webview UI Issues

1. Navigation bug: Tab key selection uses `tr:nth-child(${rowIndex+1})`. With folding, DOM order ≠ original row index. Should query by attribute `tr[data-original-row="..."]` (already used elsewhere).
2. Inconsistent naming: UI uses `foldAllDescendants`; provider & model refer to `recursiveFold`.
3. Context menu 'Unfold' isn't guaranteed to unfold (delegates to toggle).

---
## 5. Folding Logic Problems (Detail)

| Problem | Effect |
|---------|--------|
| Missing handler `foldAllDescendants` | Feature silently fails |
| `updateFoldingMetadata()` re-applies `isFolded` flags but doesn't re-hide descendants | Collapsed nodes visually expand after structural changes |
| Index-based fold restoration | Wrong rows can be marked folded after insert/delete |
| Mixed semantics (toggle vs recursive) | User confusion / inconsistent test expectations |

Example failure mode: After editing rows that shift indices, a previously folded row might stay folded but hide the wrong set of descendants or none at all.

---
## 6. Minimal Remediation Plan (Phase 1)

Goal: Make existing features consistent & predictable without large refactors.

1. Add provider handlers for `foldAllDescendants` / `unfoldAllDescendants` (map to recursive). (Implemented as alias to `recursiveFold` / `recursiveUnfold`.)
2. In `updateFoldingMetadata()`, when restoring a previously folded row, call `foldSelf(rowIndex)` (or recursive variant) so visibility recomputed correctly.
3. Fix Tab navigation DOM selection to use `data-original-row`.
4. Make context menu 'Unfold' send an explicit unfold (not toggle) → propose using message `{ type: 'recursiveFold', data: { folded: false } }` (naming odd but preserves code paths; could rename later).
5. (Optional) Introduce stable row identity (hash of trimmed cells + indent) for future fold-state persistence; defer to Phase 2.

---
## 7. Proposed Code Changes (Draft – Not Applied Yet)

Extension provider snippet (add back-compat handler):
```ts
} else if (e.type === 'foldAllDescendants') {
	const { rowIndex, folded } = e.data;
	if (folded) {
		model.recursiveFold(rowIndex);
	} else {
		model.recursiveUnfold(rowIndex);
	}
	this.refreshWebviewWithFolding(webviewPanel, model, e.data.focusCell);
}
```

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

1. Fold-All Semantics: Should "Fold All Descendants" collapse the entire subtree (hide every deeper node) or only deeper grandchildren (leaving direct children visible)? Current proposal = collapse all.
2. Identity for Fold Persistence: Accept index-based interim solution, or implement stable hash (e.g., `indent + firstCell + childCount`) now?
3. Message Vocabulary: Standardize on verbs (e.g., `foldNode`, `unfoldNode`, `foldSubtree`, `unfoldSubtree`) vs overloading `recursiveFold` with a boolean.
4. Non-Recursive Toggle: Keep both granular (`foldSelf`) and recursive operations, or simplify to recursive only in UI layer?
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
| Webview navigation with folded rows | Simulated projection: ensure next-cell selection uses attribute-based lookup |
| Context menu explicit unfold | Force-fold row recursively, send "unfold" message, assert all descendants visible |
| `foldAllDescendants` alias works | Send message; ensure same outcome as `recursiveFold` |

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
## 13. Questions for Confirmation

Please clarify:
* Q1: Confirm "Fold All Descendants" = hide every descendant (YES/NO)?
* Q2: Proceed with index-based restoration for Phase 1 (YES/NO)?
* Q3: Adopt new message names now or defer to Phase 2?

Add answers below, then we execute Phase 1.

---
## 14. Scratch / Notes

*(Use this section for ad hoc thoughts during implementation; prune before committing a polished doc.)*

---
End of transient notes.
