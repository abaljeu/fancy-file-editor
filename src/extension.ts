import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ) {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage(e => {
      if (e.type === 'edit') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), e.text);
        vscode.workspace.applyEdit(edit);
      }
    });

    webviewPanel.webview.postMessage({ type: 'init', text: document.getText() });
  }

  private getHtml(webview: vscode.Webview) {
    const htmlPath = path.join(this.context.extensionPath, 'media', 'webview.html');
    return fs.readFileSync(htmlPath, 'utf8');
  }
}

export function deactivate() {}
