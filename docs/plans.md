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
- [ ] a. Implement row insertion/deletion
- [ ] b. Implement column insertion/deletion.  Keep in mind that a our file format (newlines, tabs and text) allows ragged arrays, and we support that.  
- [ ] Handle dynamic table resizing
- [ ] Add context menus for table operations

#### Phase 6: Enhanced Features
- [ ] Add data validation for cells
- [ ] Implement proper TSV escaping for special characters
- [ ] Implement cell formatting options
- [ ] Add search/filter functionality

#### Phase 7: Responsive Design & Large Table Support
- [ ] Add virtual scrolling for performance with many rows
- [ ] Implement column resizing handles
- [ ] Add sticky headers for navigation
- [ ] Create responsive breakpoints for different screen sizes
- [ ] Add horizontal/vertical scroll synchronization
- [ ] Optimize viewport rendering for large datasets

#### Phase 8: Performance & Polish
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
