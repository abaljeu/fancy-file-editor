# Implementation Plans

## TSV Editor with Individual Cell TextAreas

### Goal
Transform the current single textarea editor into a TSV editor where each cell is its own textarea, following VS Code's Document-Webview-Provider pattern.

see [[architecture.md]]

### Linear Implementation Plan

#### Phase 1: Data Model Foundation ✓
- [x] Create `TSVDataModel` class in separate file (`src/tsvDataModel.ts`)
- [x] Implement TSV parsing functions (`parseTSV`, `serializeTSV`)
- [x] Define TypeScript interfaces (`CellPosition`, `CellEdit`, `TSVTable`)
- [x] Add cell update and data management methods
- [x] Import data model into extension

#### Phase 2: Provider Enhancement ✓
- [x] Update `MyTextEditorProvider` to use `TSVDataModel`
- [x] Change provider to send structured data (not raw text) to webview
- [x] Implement `CellEdit` message handling in provider
- [x] Add data model instance management per document
- [x] Replace full-text replacement with targeted cell updates

#### Phase 3: Webview Table Rendering ✓
- [x] Design HTML table structure in `media/webview.html`
- [x] Add CSS styling for table layout and cell inputs
- [x] Implement JavaScript to render table from structured data
- [x] Create individual input elements for each cell

#### Phase 4: Cell Interaction
- [x] Add cell navigation (tab, arrow keys)
- [x] tab, shift-tab (cell right,left), up, down
- [x] Handle focus management between cells

#### Phase 5: Table Management
- [x] a. Implement row insertion
- [x] b. Keep in mind that a our file format (newlines, tabs and text) allows ragged arrays, and we support that.  Accordingly, Enter adds a newline but no tab characters.  It will set focus to the new cell.
- [x] c. Implement column insertion.  {Tab} at the end cell of a line will add a tab.
- [x] d. Implement column deletion.  {Backspace} at the beginning of the last cell of a line will delete a tab.
- [x] e. {Backspace} if a line is empty will delete the newline.
- [x] f. Amendment to b.  like in Excel, when Enter is used, it should bring us to the column of the first data on the previous line.  This means if the line starts with tabs, we add matching tabs.

#### Phase 6: Automated Testing ✓

- [x] Set up testing infrastructure (Mocha, TypeScript)
- [x] Create comprehensive unit tests for TSV data model
- [x] Add integration tests for simulated user interactions
- [x] Test coverage for all major functionality:
  - [x] Parsing and serialization
  - [x] Cell operations and auto-expansion
  - [x] Row operations (insert, delete, Excel-like behavior)
  - [x] Column operations (add, remove, ragged arrays)
  - [x] Edge cases and error handling
  - [x] Data integrity and round-trip consistency
- [x] Unit Test Suite (64 comprehensive tests)
  - [x] TSVDataModel unit tests (31 tests)
  - [x] TSVDataModel complex workflows (8 tests) 
  - [x] MyTextEditorProvider unit tests (12 tests)
  - [x] Webview logic unit tests (13 tests)
- [ ] Integration Tests (Future Phase)
  - [ ] VS Code Extension ↔ Webview communication
  - [ ] DOM manipulation and keyboard event handling
  - [ ] File system operations and document lifecycle

#### Phase 7: Enhanced Features

- [ ] a. Folding
  - [ ] ... we need the details of folding listed here.

- [ ] Implement proper TSV escaping for special characters
- [ ] Implement cell formatting options
- [ ] Add search/filter functionality
- [ ] Handle dynamic table resizing
- [ ] Add context menus for table operations

#### Phase 8: Responsive Design & Large Table Support

- [ ] Add virtual scrolling for performance with many rows
- [ ] Implement column resizing handles
- [ ] Add sticky headers for navigation
- [ ] Create responsive breakpoints for different screen sizes
- [ ] Add horizontal/vertical scroll synchronization
- [ ] Optimize viewport rendering for large datasets

#### Phase 9: Performance & Polish

- [ ] Optimize rendering for large datasets
- [ ] Add debouncing for rapid edits
- [ ] Implement proper error handling
- [ ] Add comprehensive testing
- [ ] Documentation and examples

### Current Status

- **Completed**: Phase 1, 2, 3 (Data Model, Provider Enhancement, Webview Table Rendering)
- **Next**: Phase 4 (Cell Interaction - navigation and focus management)
- **Current State**: Basic TSV table editor with individual cell editing working

### Technical Considerations

#### Advantages

- [ ] Direct cell editing without text format knowledge
- [ ] Visual table representation
- [ ] Individual cell focus and navigation
- [ ] Can add cell-specific features (validation, formatting)

#### Challenges

- [ ] Performance with large tables (many DOM elements)
- [ ] Maintaining proper TSV escaping/unescaping
- [ ] Handling tab characters within cell content
- [ ] Synchronization complexity between many textareas and single document

#### Solutions

- [ ] Use virtual scrolling for large tables
- [ ] Implement proper TSV escaping rules
- [ ] Use contenteditable divs instead of textareas for better performance
- [ ] Debounce edit events to avoid excessive updates
