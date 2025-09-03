import * as vscode from 'vscode';

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
    // For a prototype we keep the html inline. In a real project we'd load from filesystem and
    // use proper content security policies and resource URIs.
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;height:100vh;">
  <textarea id="editor" style="width:100%; height:100%; box-sizing: border-box; font-family: monospace;"></textarea>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {
      if (event.data.type === 'init') {
        document.getElementById('editor').value = event.data.text;
      }
    });
    document.getElementById('editor').addEventListener('input', e => {
      vscode.postMessage({ type: 'edit', text: e.target.value });
    });
  </script>
</body>
</html>`;
  }
}

export function deactivate() {}
