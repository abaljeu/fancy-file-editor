# Performance Strategy

Date: 2025-09-04

Goal: Reach responsive "good text editor" feel at ~100k logical lines while keeping early
implementation simple. This document sets guardrails so initial features do not block scaling.

Scope Principles

1. Do not prematurely optimize deep internals (piece table, canvas) before feature completeness.
2. Do avoid patterns that will force a full rewrite (e.g., per-row DOM queries on every key).
3. Prefer clear seams that allow swapping implementations later (renderer, storage, layout).

Target Experience (Eventually)

- 100k rows scroll at 60fps.
- Cursor move / edit < 5 ms end-to-end.
- Fold/unfold large subtree (10k rows) < 10 ms.
- Incremental paste (thousands of lines) absorbed without freezing UI.

High-Level Phases

Phase 1 (Now): Functional correctness + basic caching.
Phase 2: Virtualized DOM with recycling.
Phase 3: Incremental text structure (piece table or similar) + diff-based persistence.
Phase 4: Canvas + single shared textarea overlay, variable row heights.
Phase 5: Advanced (parallel parsing, background indexing, semantic regions).

Data Model Strategy

Current: Simple array-of-rows is acceptable for early operations.
Upgrade Path:
- Introduce an interface RowStore with minimal methods:
  getLine(n), insertAfter(idx, lines[]), deleteRange(start, end), spliceCells(row,...)
- Back implementation first by simple array; later swap to piece table without changing call sites.
- Maintain separate arrays for indentation, folding flags, and cached width/height metadata.

Folding Representation

- Near term: boolean isFolded per row + implicit visibility walk.
- Scalable form: maintain ordered list of fold ranges (start, end). Use a segment tree / interval
  structure to answer "isVisible" and to compute next/previous visible row in O(log n).
- Expose helpers nextVisible(idx), prevVisible(idx), visibleCountInRange(start, end).

Visibility Projection

- Avoid recomputing full visible array per keystroke.
- Cache last fold version + dirty range markers.
- Provide iterator for virtualization window generation (skip folded ranges quickly).

Rendering Strategy

DOM Table (current / interim):
- Keep DOM row count bounded (initially all rows until virtualization lands; do not optimize here
  until needed).
- Remove full-document querySelectorAll on frequent events (cache visibleRowOrder after render).

Virtualized DOM (Phase 2):
- Fixed baseline row height for fast approximate mapping scrollTop -> row index.
- Keep a small overscan buffer (e.g., ±50 rows) to minimize reflow during fast scroll.
- Recycle row elements: maintain a pool; reassign dataset.originalRow + cell values.
- Batch DOM writes using a single document fragment and container.replaceChildren.

Variable Row Height (future):
- Track actual measured heights in a Fenwick (BIT) or segment tree to compute prefix sums.
- Maintain two mapping functions:
  approxIndexForScroll(scrollTop) using average height for early guess.
  refineIndex(scrollTop) resolving via prefix sums with at most O(log n) adjustments.
- Only measure newly introduced or dirty rows (ResizeObserver or on first render).

Canvas Renderer (Phase 4):
- All non-active rows drawn on canvas (text + fold marks + selection highlights).
- One absolutely positioned textarea placed over active cell/row.
- Off-screen text metrics cached; implement simple glyph width cache keyed by font + char.
- Redraw pipeline:
  1. Process input/model changes -> invalidation regions (row ranges)
  2. Clip redraw to those row pixel bands
  3. Draw background, indent guides, fold indicators, text, cursor, selection
- Hit testing: binary search using cumulative heights for click -> row mapping.

Edit Application

- Initial: full TSV string rewrite (acceptable for small files; not for 100k lines).
- Transition: range-based text edits (collect cell-level updates and synthesize minimal splice).
- Final: direct model mutation; serialization only when saving or when VS Code buffer needs sync.

IPC (Extension <-> Webview) Strategy

- Early: send full visible rows array on refresh.
- Next: send patch objects { added:[], removed:[], updated:[] } with stable row ids.
- Later: send only semantic operations (e.g., { op: 'cell', row: 123, col: 2, value: 'X' }).
- Binary / compact encoding optional only if JSON profile shows bottleneck.

Keyboard / Navigation Path

- Must be O(1) per key: lookup current visible position from cache map; compute neighbor index.
- Never query DOM for all rows on navigation; avoid layout-producing reads.

Scrolling

- Use a spacer (padding div with total height) + inner viewport cluster of rows/canvas.
- Listen to scroll events; throttle re-render to animation frame (requestAnimationFrame).
- Avoid reading scrollTop multiple times inside one frame.

Memory Constraints

- Target per row metadata budget < 64 bytes (fold flags, indent, cached width/height, hash).
- Deduplicate identical cell strings if large repetition emerges (optional heuristic later).

Instrumentation & Profiling

- Add performance marks: renderStart/renderEnd, foldToggleStart/foldToggleEnd.
- Provide debug overlay (counts: DOM rows, model rows, render ms, last op breakdown).
- Hook a simple moving average for key latency; log if > threshold.

Risk Mitigation Choices

- Establish interfaces early (RowStore, Renderer, FoldIndex) to localize later rewrites.
- Avoid deep coupling between model and DOM (no direct DOM references stored in model).
- Keep rendering stateless given (visibleSlice, focus, selection) to simplify future canvas migration.

Do Not Do (Anti-Patterns)

- No per-row inline style changes mid-frame (batch class toggles instead).
- No measuring text widths for all rows preemptively; measure lazily.
- No storing DOM nodes in arrays that mirror model (leads to sync pitfalls).
- No synchronous heavy parsing on every keypress (mark dirty, debounce parse region if needed).

Immediate Guardrail Tasks (Actionable Soon)

1. Cache visibleRowOrder and index map on render.
2. Abstract row insertion so later it can skip hidden descendants without DOM inspection.
3. Encapsulate folding visibility calculation behind an interface.
4. Begin instrumentation (simple console.time wrappers) gated by a debug flag.

Future Checklist (Before Scaling Tests)

- Replace full-document text apply with minimal range edits.
- Introduce virtualization window.
- Add fold range index.
- Introduce RowStore abstraction.
- Add variable height tracking scaffold (even if all rows same height initially).
- Prototype canvas renderer in parallel behind a feature flag.

Success Criteria for 100k Rows (Benchmark Outline)

- Load time: < 1 s to first interactive (model parse + initial viewport render).
- Scroll test (page down 50 times): no frame > 32 ms; average < 16 ms.
- Rapid edit (hold key repeating in one cell): sustained > 100 updates/sec without lag.
- Massive paste (5k lines): UI blocked < 200 ms, viewport re-renders incrementally.

Open Decisions (Track Separately)

- Piece table vs rope vs array-of-chunks (defer until Phase 3 start).
- Canvas batching strategy (full row redraw vs dirty cell sub-rects).
- Selection model complexity (multi-cursor?) influencing renderer complexity.

End of performance strategy.
