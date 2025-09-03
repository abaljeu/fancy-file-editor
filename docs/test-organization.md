# Test File Organization Summary

## Overview
The test suite has been reorganized to follow a class-based structure where each test file focuses on a single component/class with clear scope boundaries.

## Test Structure (64 tests total)

### 1. `tsvDataModel.test.ts` - TSVDataModel Unit Tests (31 tests)

**Purpose**: Test the core data model class functionality
**Scope**: Single class unit testing
**Categories**:

- Parsing and Serialization (5 tests)
- Cell Operations (4 tests)  
- Row Operations (7 tests)
- Column Operations (4 tests)
- Edge Cases and Error Handling (4 tests)
- Excel-like Features (7 tests)

### 2. `tsvDataModel.workflows.test.ts` - TSVDataModel Complex Workflows (8 tests)

**Purpose**: Test complex multi-step user interaction scenarios
**Scope**: Complex unit tests simulating real user workflows
**Categories**:

- Simulated User Editing Workflows (6 tests)
- Data Integrity and Consistency (2 tests)

### 3. `myTextEditorProvider.test.ts` - MyTextEditorProvider Unit Tests (12 tests)

**Purpose**: Test the VS Code extension provider class logic
**Scope**: Single class unit testing
**Categories**:

- Message Handling Logic (5 tests)
- Data Transformation Logic (3 tests)
- Provider State Management Logic (2 tests)
- HTML Template Logic (2 tests)

### 4. `webview.logic.test.ts` - Webview Logic Unit Tests (13 tests)

**Purpose**: Test webview-related logic and calculations
**Scope**: Logic unit tests for webview functionality
**Categories**:

- Table Rendering Logic (3 tests)
- Keyboard Navigation Logic (6 tests)
- Cell Editing Logic (2 tests)
- Backspace Logic Conditions (4 tests)
- Context Menu Logic (2 tests)
- Focus Management Logic (2 tests)
- Message Passing Logic (2 tests)

## Test Organization Principles

### 1. **Singular Scope Per File**

- Each test file focuses on testing exactly one class or component
- No mixing of different classes in the same test file
- Clear naming convention: `[className].test.ts` or `[component].logic.test.ts`

### 2. **Clear Test Categories**

- Unit Tests: Test individual methods and properties of a single class
- Complex Workflows: Test multi-step scenarios within a single class
- Logic Tests: Test computational logic and algorithms without external dependencies

### 3. **Proper Test Naming**

- File names clearly indicate what component they test
- Test descriptions are specific and action-oriented
- Test categories group related functionality

## Test Types and Purposes

### Unit Tests

- **TSVDataModel**: Core data operations, parsing, serialization
- **MyTextEditorProvider**: VS Code extension provider logic
- **Webview Logic**: Client-side calculations and message structures

### Complex Workflow Tests

- **TSVDataModel Workflows**: Multi-step user editing scenarios
- Simulates real Excel-like user interactions
- Tests data consistency across multiple operations

### What's NOT Covered (Future Integration Testing)

- True VS Code Extension ↔ Webview integration
- DOM manipulation and rendering
- Actual keyboard event handling
- File system operations
- VS Code API interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx mocha out/test/tsvDataModel.test.js
```

## Test File Dependencies

All test files are independent and can run in any order:

- No shared state between test files
- Each test file imports only what it needs
- No cross-test-file dependencies

## Future Integration Testing Considerations

To add true integration tests, we would need:

1. **DOM Testing Environment**: JSDOM or similar for webview testing
2. **VS Code Test Environment**: Using `@vscode/test-electron`
3. **Mock File System**: For document save/load operations
4. **Event Simulation**: For keyboard and mouse interactions
5. **Webview Communication Testing**: Mock `vscode.postMessage`

This would be a separate test category: `integration.test.ts` files that test the full Extension ↔ VS Code ↔ Webview communication flow.
