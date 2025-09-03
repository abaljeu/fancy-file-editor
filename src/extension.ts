import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TSVDataModel, CellEdit, CellPosition } from './tsvDataModel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'fancy-file-editor.myTextEditor',
      new MyTextEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

class MyTextEditorProvider implements vscode.CustomTextEditorProvider {
  private tsvModels = new Map<string, TSVDataModel>();

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ) {
    // Create TSV data model for this document
    const tsvModel = new TSVDataModel(document.getText());
    this.tsvModels.set(document.uri.toString(), tsvModel);

    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

    // Handle cell edit messages from webview
    webviewPanel.webview.onDidReceiveMessage(e => {
      const model = this.tsvModels.get(document.uri.toString());
      if (!model) return;

      if (e.type === 'cellEdit') {
        // Handle individual cell edit
        const cellEdit: CellEdit = e.data;
        model.updateCell(cellEdit);
        
        // Update the document with new TSV content
        const newTsvText = model.toTSV();
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newTsvText);
        vscode.workspace.applyEdit(edit);
      } else if (e.type === 'insertRow') {
        // Handle row insertion with Excel-like indentation
        const { rowIndex, position } = e.data; // position: 'before' or 'after'
        let newRowIndex: number;
        let focusCol: number;
        
        if (position === 'after') {
          const result = model.insertRowWithIndent(rowIndex);
          newRowIndex = result.newRowIndex;
          focusCol = result.focusCol;
        } else {
          model.insertRowBefore(rowIndex);
          newRowIndex = rowIndex;
          focusCol = 0; // For "before" insertion, start at beginning
        }
        
        // Update document and refresh webview with focus on new row
        this.updateDocumentAndRefresh(document, webviewPanel, model, { row: newRowIndex, col: focusCol });
      } else if (e.type === 'deleteRow') {
        // Handle row deletion
        const { rowIndex } = e.data;
        model.deleteRow(rowIndex);
        
        // Update document and refresh webview
        this.updateDocumentAndRefresh(document, webviewPanel, model);
      } else if (e.type === 'addColumn') {
        // Handle adding column to specific row
        const { rowIndex, newColIndex } = e.data;
        model.addColumnToRow(rowIndex);
        
        // Update document and refresh webview with focus on new column
        this.updateDocumentAndRefresh(document, webviewPanel, model, { row: rowIndex, col: newColIndex });
      } else if (e.type === 'removeColumn') {
        // Handle removing last column from specific row
        const { rowIndex, focusCol } = e.data;
        const removed = model.removeLastColumnFromRow(rowIndex);
        
        if (removed) {
          // Update document and refresh webview with focus on previous column
          this.updateDocumentAndRefresh(document, webviewPanel, model, { row: rowIndex, col: focusCol });
        }
      } else if (e.type === 'toggleFold') {
        // Handle fold toggle
        const { rowIndex } = e.data;
        model.toggleFold(rowIndex);
        
        // Refresh webview with new visible rows (no document update needed)
        this.refreshWebviewWithFolding(webviewPanel, model, e.data.focusCell);
      } else if (e.type === 'recursiveFold') {
        // Handle recursive fold/unfold
        const { rowIndex, folded } = e.data;
        if (folded) {
          model.recursiveFold(rowIndex);
        } else {
          model.recursiveUnfold(rowIndex);
        }
        
        // Refresh webview with new visible rows (no document update needed)
        this.refreshWebviewWithFolding(webviewPanel, model, e.data.focusCell);
      }
    });

    // Send visible rows data to webview with folding support
    const visibleRows = tsvModel.getVisibleRows();
    webviewPanel.webview.postMessage({ 
      type: 'init', 
      data: {
        visibleRows: visibleRows
      }
    });

    // Clean up model when webview is disposed
    webviewPanel.onDidDispose(() => {
      this.tsvModels.delete(document.uri.toString());
    });
  }

  private updateDocumentAndRefresh(
    document: vscode.TextDocument, 
    webviewPanel: vscode.WebviewPanel, 
    model: TSVDataModel, 
    focusCell?: { row: number; col: number }
  ) {
    // Update the document with new TSV content
    const newTsvText = model.toTSV();
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newTsvText);
    vscode.workspace.applyEdit(edit);

    // Send updated visible rows to webview
    const visibleRows = model.getVisibleRows();
    webviewPanel.webview.postMessage({ 
      type: 'refresh', 
      data: {
        visibleRows: visibleRows,
        focusCell: focusCell
      }
    });
  }

  // Refresh webview with folding support (no document update)
  private refreshWebviewWithFolding(webviewPanel: vscode.WebviewPanel, model: TSVDataModel, focusCell?: CellPosition): void {
    const visibleRows = model.getVisibleRows();
    webviewPanel.webview.postMessage({ 
      type: 'refresh', 
      data: {
        visibleRows: visibleRows,
        focusCell: focusCell
      }
    });
  }

  private getHtml(webview: vscode.Webview) {
    const htmlPath = path.join(this.context.extensionPath, 'media', 'webview.html');
    const cssPath = path.join(this.context.extensionPath, 'media', 'table.css');
    
    // Read HTML file
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Create webview URI for CSS file
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    
    // Replace CSS link with proper webview URI
    html = html.replace('href="table.css"', `href="${cssUri}"`);
    
    return html;
  }
}

export function deactivate() {}
