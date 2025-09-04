// Webview script extracted from inline HTML

const vscode = acquireVsCodeApi();

// Handle individual cell edit
function handleCellEdit(event) {
  const input = event.target;
  const row = parseInt(input.dataset.row);
  const col = parseInt(input.dataset.col);

  vscode.postMessage({
    type: 'cellEdit',
    data: {
      position: { row, col },
      value: input.value
    }
  });
}

// Returns ordered list of visible original row indices
function getVisibleRowOrder() {
  return Array.from(document.querySelectorAll('tr[data-original-row]'))
    .map(tr => parseInt(tr.dataset.originalRow));
}

// Unified keyboard event handler for all cell interactions
function handleKeyDown(event, rowIndex, colIndex) {
  const input = event.target;

  if (event.ctrlKey && event.key === '.') {
    vscode.postMessage({
      type: 'toggleFold',
      data: { rowIndex: rowIndex, focusCell: { row: rowIndex, col: colIndex } }
    });
    event.preventDefault();
    return;
  }

  if (event.key === 'Enter') {
    vscode.postMessage({
      type: 'insertRow',
      data: { rowIndex: rowIndex, position: 'after' }
    });
    event.preventDefault();
    return;
  }

  if (event.ctrlKey && event.key === 'Delete') {
    vscode.postMessage({
      type: 'deleteRow',
      data: { rowIndex: rowIndex }
    });
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace' && input.selectionStart === 0) {
    const currentRow = document.querySelector(`tr[data-original-row="${rowIndex}"]`);
    const cellsInRow = currentRow ? currentRow.querySelectorAll('input').length : 0;

    if (cellsInRow === 1 && input.value === '') {
      vscode.postMessage({
        type: 'deleteRow',
        data: { rowIndex: rowIndex }
      });
      event.preventDefault();
      return;
    } else if (input.value === '' && colIndex + 1 >= cellsInRow && cellsInRow > 1) {
      vscode.postMessage({
        type: 'removeColumn',
        data: { rowIndex: rowIndex, focusCol: colIndex - 1 }
      });
      event.preventDefault();
      return;
    }
  }

  let targetRow = rowIndex;
  let targetCol = colIndex;
  let shouldNavigate = false;
  switch(event.key) {
    case 'Tab':
      if (event.shiftKey) {
        targetCol = colIndex - 1;
        shouldNavigate = true;
      } else {
        const currentRow = document.querySelector(`tr[data-original-row="${rowIndex}"]`);
        const cellsInRow = currentRow ? currentRow.querySelectorAll('input').length : 0;
        if (colIndex + 1 >= cellsInRow) {
          vscode.postMessage({
            type: 'addColumn',
            data: { rowIndex: rowIndex, newColIndex: colIndex + 1 }
          });
          event.preventDefault();
          return;
        } else {
          targetCol = colIndex + 1;
          shouldNavigate = true;
        }
      }
      break;
    case 'ArrowUp': {
      const order = getVisibleRowOrder();
      const idx = order.indexOf(rowIndex);
      if (idx > 0) {
        targetRow = order[idx - 1];
        shouldNavigate = true;
      }
      break;
    }
    case 'ArrowDown': {
      const order = getVisibleRowOrder();
      const idx = order.indexOf(rowIndex);
      if (idx !== -1 && idx < order.length - 1) {
        targetRow = order[idx + 1];
        shouldNavigate = true;
      }
      break;
    }
    case 'ArrowLeft':
      if (input.selectionStart === 0) { targetCol = colIndex - 1; shouldNavigate = true; }
      break;
    case 'ArrowRight':
      if (input.selectionStart === input.value.length) { targetCol = colIndex + 1; shouldNavigate = true; }
      break;
  }

  if (shouldNavigate) {
    event.preventDefault();
    const targetRowEl = document.querySelector(`tr[data-original-row="${targetRow}"]`);
    if (targetRowEl) {
      // Clamp column if target row shorter
      const maxCol = targetRowEl.querySelectorAll('input').length - 1;
      const finalCol = Math.max(0, Math.min(targetCol, maxCol));
      const targetInput = document.querySelector(`[data-row="${targetRow}"][data-col="${finalCol}"]`);
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  }
}

let contextMenuRow = -1;
function showContextMenu(event, rowIndex) {
  event.preventDefault();
  contextMenuRow = rowIndex;
  const menu = document.getElementById('context-menu');
  menu.style.display = 'block';
  menu.style.left = event.pageX + 'px';
  menu.style.top = event.pageY + 'px';
}
function hideContextMenu() { document.getElementById('context-menu').style.display = 'none'; }

function insertRowBefore() {
  vscode.postMessage({ type: 'insertRow', data: { rowIndex: contextMenuRow, position: 'before' } });
  hideContextMenu();
}
function insertRowAfter() {
  vscode.postMessage({ type: 'insertRow', data: { rowIndex: contextMenuRow, position: 'after' } });
  hideContextMenu();
}
function deleteRow() {
  vscode.postMessage({ type: 'deleteRow', data: { rowIndex: contextMenuRow } });
  hideContextMenu();
}

function renderTable(visibleRows) {
  const table = document.getElementById('tsv-table');
  table.innerHTML = '';
  visibleRows.forEach((rowData) => {
    const tr = document.createElement('tr');
    tr.dataset.originalRow = rowData.originalRowIndex;
    tr.addEventListener('contextmenu', (event) => showContextMenu(event, rowData.originalRowIndex));
    const foldTd = document.createElement('td');
    foldTd.className = 'fold-margin';
    if (rowData.isFoldable) {
      const foldIndicator = document.createElement('span');
      foldIndicator.className = 'fold-indicator';
      foldIndicator.dataset.foldable = 'true';
      foldIndicator.dataset.folded = rowData.isFolded ? 'true' : 'false';
      foldIndicator.addEventListener('click', () => toggleFold(rowData.originalRowIndex));
      foldTd.appendChild(foldIndicator);
    }
    tr.appendChild(foldTd);
  rowData.cells.forEach((cellValue, colIndex) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'cell-input';
      input.value = cellValue || '';
      input.dataset.row = rowData.originalRowIndex;
      input.dataset.col = colIndex;
      input.addEventListener('input', handleCellEdit);
      input.addEventListener('keydown', (event) => handleKeyDown(event, rowData.originalRowIndex, colIndex));
      td.appendChild(input);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

function toggleFold(rowIndex) { vscode.postMessage({ type: 'toggleFold', data: { rowIndex: rowIndex } }); }
function foldRow() { if (contextMenuRow !== -1) { vscode.postMessage({ type: 'toggleFold', data: { rowIndex: contextMenuRow } }); } hideContextMenu(); }
function unfoldRow() { if (contextMenuRow !== -1) { vscode.postMessage({ type: 'toggleFold', data: { rowIndex: contextMenuRow } }); } hideContextMenu(); }
function recursiveFold() { if (contextMenuRow !== -1) { vscode.postMessage({ type: 'recursiveFold', data: { rowIndex: contextMenuRow, folded: true } }); } hideContextMenu(); }
function recursiveUnfold() { if (contextMenuRow !== -1) { vscode.postMessage({ type: 'recursiveFold', data: { rowIndex: contextMenuRow, folded: false } }); } hideContextMenu(); }

document.addEventListener('click', hideContextMenu);
window.addEventListener('message', event => {
  if (event.data.type === 'init' || event.data.type === 'refresh') {
    const { visibleRows, focusCell } = event.data.data;
    renderTable(visibleRows);
    if (focusCell) {
      setTimeout(() => {
        const targetInput = document.querySelector(`[data-row="${focusCell.row}"][data-col="${focusCell.col}"]`);
        if (targetInput) { targetInput.focus(); }
      }, 50);
    }
  }
});
