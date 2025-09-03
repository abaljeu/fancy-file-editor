import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TSVDataModel, CellEdit } from './tsvDataModel';

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
        // Handle row insertion
        const { rowIndex, position } = e.data; // position: 'before' or 'after'
        if (position === 'after') {
          model.insertRowAfter(rowIndex);
        } else {
          model.insertRowBefore(rowIndex);
        }
        
        // Update document and refresh webview
        this.updateDocumentAndRefresh(document, webviewPanel, model);
      } else if (e.type === 'deleteRow') {
        // Handle row deletion
        const { rowIndex } = e.data;
        model.deleteRow(rowIndex);
        
        // Update document and refresh webview
        this.updateDocumentAndRefresh(document, webviewPanel, model);
      }
    });

    // Send structured data to webview instead of raw text
    const tableData = tsvModel.getData();
    const dimensions = tsvModel.getDimensions();
    webviewPanel.webview.postMessage({ 
      type: 'init', 
      data: {
        table: tableData,
        dimensions: dimensions
      }
    });

    // Clean up model when webview is disposed
    webviewPanel.onDidDispose(() => {
      this.tsvModels.delete(document.uri.toString());
    });
  }

  private updateDocumentAndRefresh(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, model: TSVDataModel) {
    // Update the document with new TSV content
    const newTsvText = model.toTSV();
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newTsvText);
    vscode.workspace.applyEdit(edit);

    // Send updated data to webview
    const tableData = model.getData();
    const dimensions = model.getDimensions();
    webviewPanel.webview.postMessage({ 
      type: 'init', 
      data: {
        table: tableData,
        dimensions: dimensions
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
