# Implementation Plans

## TSV Editor with Individual Cell TextAreas

### Goal
Transform the current single textarea editor into a TSV editor where each cell is its own textarea, allowing direct editing of individual cells while maintaining the TSV file structure.

### Technical Approach

#### 1. Parse TSV Data
- [ ] Split the document text by newlines to get rows
- [ ] Split each row by tabs to get individual cells
- [ ] Create a 2D array data structure to represent the table

#### 2. Render as HTML Table
- [ ] Replace the single textarea with an HTML `<table>` element
- [ ] Each cell becomes a `<textarea>` or `<input>` element
- [ ] Use CSS to style the table for proper alignment and appearance

#### 3. Handle Individual Cell Edits
- [ ] Add event listeners to each cell's textarea/input
- [ ] On cell change, update the corresponding position in the data structure
- [ ] Serialize the 2D array back to TSV format (join cells with tabs, rows with newlines)
- [ ] Send the complete TSV string back to VS Code via postMessage

#### 4. Dynamic Table Management
- [ ] Support adding/removing rows and columns
- [ ] Handle empty cells gracefully
- [ ] Maintain proper TSV structure even with irregular data

### Implementation Steps

1. **Phase 1: Basic TSV Parsing**
   - [ ] Modify webview HTML to include table structure
   - [ ] Add JavaScript functions to parse TSV into 2D array
   - [ ] Render initial table from parsed data

2. **Phase 2: Cell Editing**
   - [ ] Add input event handlers for each cell
   - [ ] Implement TSV serialization function
   - [ ] Wire up edit synchronization with extension

3. **Phase 3: Enhanced Features**
   - [ ] Add row/column insertion/deletion
   - [ ] Improve CSS styling for better UX
   - [ ] Handle edge cases (empty cells, special characters)

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

#### Potential Solutions
- [ ] Use virtual scrolling for large tables
- [ ] Implement proper TSV escaping rules
- [ ] Use contenteditable divs instead of textareas for better performance
- [ ] Debounce edit events to avoid excessive updates

### File Structure Changes Needed
- [ ] Update `media/webview.html` with table-based layout
- [ ] Modify extension.ts message handling for cell-based edits
- [ ] Add CSS for table styling and responsive design
