# Testing Guide

## Overview
comprehensive automated tests for the TSV data model to ensure reliability and catch regressions.

## Running Tests

### Quick Test Run

```bash
npm test
```

### Watch Mode (runs tests when files change)

```bash
npm run test:watch
```

### Build and Test

```bash
npm run build && npm test
```

## Test Structure

### Test Coverage

Our tests cover the following areas:

#### 1. **Parsing and Serialization**

- TSV text parsing into 2D arrays
- Handling empty content
- Ragged array support (different row lengths)
- Round-trip serialization (parse → modify → serialize)
- Edge cases with trailing newlines and tabs

#### 2. **Cell Operations**

- Individual cell updates
- Auto-expansion when editing beyond table bounds
- Table dimension calculations
- Handling invalid cell positions

#### 3. **Row Operations** 

- Insert row before/after specified positions
- Delete rows with safety checks (preserve last row)
- Excel-like indentation for new rows
- Focus management after operations

#### 4. **Column Operations**

- Add columns to specific rows (ragged array support)
- Remove columns with safety checks
- Handle invalid row indices gracefully

#### 5. **Edge Cases and Error Handling**

- Trailing newlines and tabs
- Mixed empty and filled cells
- Data integrity after multiple operations
- Round-trip consistency

## Test Examples

### Basic Usage Test

```typescript
it('should parse simple TSV text', () => {
  const tsvText = 'Name\tAge\tCity\nJohn\t25\tNew York';
  const model = new TSVDataModel(tsvText);
  const data = model.getData();
  
  assert.strictEqual(data.length, 2);
  assert.deepStrictEqual(data[0], ['Name', 'Age', 'City']);
});
```

### Ragged Array Test

```typescript
it('should handle ragged arrays', () => {
  const tsvText = 'A\tB\tC\nX\tY\nP';
  const model = new TSVDataModel(tsvText);
  // Validates different row lengths are preserved
});
```

### Excel-like Behavior Test

```typescript
it('should insert row with Excel-like indentation', () => {
  const indentedModel = new TSVDataModel('Header\tData\n\tJohn\t25');
  const result = indentedModel.insertRowWithIndent(1);
  // Validates new row matches indentation of reference row
});
```

## Benefits of Automated Testing

1. **Regression Prevention** - Catch breaking changes immediately
2. **Documentation** - Tests serve as usage examples
3. **Confidence** - Safe refactoring with test coverage
4. **Edge Case Coverage** - Comprehensive scenario testing
5. **CI/CD Ready** - Automated validation in build pipelines

## Adding New Tests

When adding new features to the TSV data model:

1. Add test cases to `src/test/tsvDataModel.test.ts`
2. Follow the existing test structure and naming conventions
3. Include both positive and negative test cases
4. Test edge cases and error conditions
5. Run tests to ensure they pass: `npm test`

## Test File Location

- **Main test file**: `src/test/tsvDataModel.test.ts`
- **Compiled tests**: `out/test/` (generated during build)
- **Test runner**: Mocha with TypeScript support
