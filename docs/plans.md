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

#### Phase 2: Provider Enhancement
- [ ] Update `MyTextEditorProvider` to use `TSVDataModel`
- [ ] Change provider to send structured data (not raw text) to webview
- [ ] Implement `CellEdit` message handling in provider
- [ ] Add data model instance management per document
- [ ] Replace full-text replacement with targeted cell updates

#### Phase 3: Webview Table Rendering
- [ ] Design HTML table structure in `media/webview.html`
- [ ] Add CSS styling for table layout and cell inputs
- [ ] Implement JavaScript to render table from structured data
- [ ] Create individual input elements for each cell
- [ ] Add responsive design for large tables

#### Phase 4: Cell Interaction
- [ ] Add event listeners for individual cell edits
- [ ] Implement `CellEdit` message sending to provider
- [ ] Add cell navigation (tab, arrow keys)
- [ ] Handle focus management between cells
- [ ] Add visual feedback for active cell

#### Phase 5: Table Management
- [ ] Implement row insertion/deletion
- [ ] Implement column insertion/deletion
- [ ] Handle dynamic table resizing
- [ ] Add context menus for table operations
- [ ] Maintain proper TSV structure with operations

#### Phase 6: Enhanced Features
- [ ] Add data validation for cells
- [ ] Implement proper TSV escaping for special characters
- [ ] Add virtual scrolling for large tables
- [ ] Implement cell formatting options
- [ ] Add search/filter functionality

#### Phase 7: Performance & Polish
- [ ] Optimize rendering for large datasets
- [ ] Add debouncing for rapid edits
- [ ] Implement proper error handling
- [ ] Add comprehensive testing
- [ ] Documentation and examples

### Current Status
- **Completed**: Phase 1 (Data Model Foundation)
- **Next**: Phase 2 (Provider Enhancement)
- **Current Provider**: Basic text-based, needs TSV model integration

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
