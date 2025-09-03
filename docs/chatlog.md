Skip to content
Chat history

You said:
I’m thinking about creating a custom editor in vscode.  It would feature custom rendering with the editor interface, have navigation commands, keybinds and ultimately enable modifying a specific filetype.  Does vscode support such?  what’s a major example of this?
ChatGPT said:
Yes — VS Code does support this. What you’re describing matches custom editors (and to some extent, webview editors) in the VS Code extension API.

What VS Code Supports
Custom rendering: You can take over the rendering of a file type by implementing a custom editor. Internally, VS Code opens a webview panel (an embedded browser context) where you control the entire rendering and interaction surface.

Navigation commands & keybinds: Extensions can contribute commands and keybindings, and you can scope them so they only apply when your custom editor is active.

Filetype modification: The custom editor API connects to the underlying document model, so edits made in your editor can be synchronized back to the file on disk. You can also hook into save/undo/redo.

There are two common flavors:

Custom Text Editors – if your file type is fundamentally text-based (you want your own rendering of text content, but still benefit from VS Code’s diffing, undo/redo, etc.).

Custom Read/Write Editors – if your file is not naturally text (binary, JSON+assets, images, diagrams, CAD-like things), and you want to provide your own editing surface.

Major Example
The most prominent example is the VS Code built-in image preview/editor:

Opening a .png or .jpg doesn’t show plain text, it opens a custom editor that renders the image.

Extensions use this same model — for example:

Markdown Preview (rendered HTML alongside text).

Draw.io Integration (lets you edit diagrams visually).

Hex Editor extension by Microsoft (renders binary as hex + ASCII with editing).

Jupyter Notebook integration (custom editor rendering rich notebooks, handling cells, execution, etc.).

So yes — VS Code is designed to let extensions provide exactly what you’re describing: a full custom editor with rendering, commands, keybinds, and document modification.

👉 Do you want me to walk you through the minimal extension boilerplate for registering a custom editor (so you can start prototyping), or would you rather see a deep-dive into a large example like the Hex Editor or Jupyter Notebook to study its architecture?

You said:
text-based is what i want.  The markdown preview works the wrong way: it has me editing markdown in a regular editor and only previews the file in rendering.  maybe jupyter notebook is closer, but that environment might be more complex than ideally i’d want for a basic trial.
ChatGPT said:
Got it — you’re talking about taking over the editing surface for a text-based file, so instead of the split “source vs. preview” approach (like Markdown), the file itself always opens in your custom renderer/editor. That is exactly what Custom Text Editors in VS Code are for.

How Custom Text Editors Differ
Ownership of rendering:
Instead of VS Code’s standard text editor, your extension opens a webview bound to the document. You render text however you like (HTML canvas, React/Elmish app, etc.).

Document sync:
You use CustomTextEditorProvider to read/write the text document. VS Code still tracks undo/redo, saves to disk, and participates in diff/merge, but you control how it’s displayed and edited.

Commands & keybinds:
Since you run in a webview, you can wire any key events to VS Code commands via the postMessage API and extension commands.

Real Example
A major example is the VS Code Notebook API (used by Jupyter, GitHub Copilot Labs notebooks, etc.).
But for something closer to what you want:

Monaco Editor playgrounds: Some extensions wrap Monaco (the text editor engine VS Code itself uses) inside a webview to apply custom syntax, highlighting, or UI overlays.

AsciiDoc Editor or LaTeX Workshop: They don’t just preview — they provide richer editing with custom panels.

The official Hex Editor extension is also instructive: even though it’s for binary, it shows how to wire a CustomTextEditorProvider and drive the UI entirely from your code.

Minimal Flow for a Trial
Here’s what a skeleton looks like:

extension.ts

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'myLang.editor',               // viewType
      new MyTextEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

class MyTextEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ) {
    // Setup webview
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtml();

    // Listen for edits from webview
    webviewPanel.webview.onDidReceiveMessage(e => {
      if (e.type === 'edit') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), e.text);
        vscode.workspace.applyEdit(edit);
      }
    });

    // Push document text into the webview
    webviewPanel.webview.postMessage({ type: 'init', text: document.getText() });
  }

  private getHtml() {
    return `<!DOCTYPE html>
<html><body>
  <textarea id="editor" style="width:100%; height:100%"></textarea>
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
</body></html>`;
  }
}
package.json

{
  "contributes": {
    "customEditors": [
      {
        "viewType": "myLang.editor",
        "displayName": "My Language Editor",
        "selector": [{ "filenamePattern": "*.mytxt" }]
      }
    ]
  }
}
That gives you:

A .mytxt file opens in your custom editor.

You see a <textarea> instead of VS Code’s text editor.

Typing there pushes edits back into VS Code’s text document system (so saves, undo/redo, diffs all still work).

✅ This is the simplest possible trial, and you can later:

Replace <textarea> with a rich renderer (React, Elmish, CodeMirror, or even a canvas).

Add navigation commands by wiring messages between webview and extension.

Define keybindings in package.json tied to your editor.

Would you like me to show you a step-by-step path (first get the textarea demo working, then swap in a richer renderer like CodeMirror/Monaco), or a study of how the Hex Editor does it for a production-level pattern?




No file chosenNo file chosen
ChatGPT can make mistakes. Check important info. See Cookie Preferences.
