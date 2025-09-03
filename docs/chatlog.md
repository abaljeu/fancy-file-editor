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
        "selector": [{ "filenamePattern": "*.tsb" }]
      }
    ]
  }
}
That gives you:

A .tsb file opens in your custom editor.

You see a <textarea> instead of VS Code’s text editor.

Typing there pushes edits back into VS Code’s text document system (so saves, undo/redo, diffs all still work).

✅ This is the simplest possible trial, and you can later:

Replace <textarea> with a rich renderer (React, Elmish, CodeMirror, or even a canvas).

Add navigation commands by wiring messages between webview and extension.

Define keybindings in package.json tied to your editor.

Would you like me to show you a step-by-step path (first get the textarea demo working, then swap in a richer renderer like CodeMirror/Monaco), or a study of how the Hex Editor does it for a production-level pattern?


I'll read overview.md to add a short entry for the new fancy-file-editor subproject, then create the VS Code extension project skeleton under fancy-file-editor with TypeScript, a basic package.json, tsconfig.json, src/extension.ts (from chatlog's example), src/webview/index.html, README.md, README in root maybe, and minimal test and GitHub Action. I'll now read overview.md.

Read overview.md

I'll create the extension skeleton files and update overview.md to add an entry for fancy-file-editor. I'll apply patches to add files under fancy-file-editor and update the docs. Expected outcome: new folder with minimal VS Code extension TypeScript skeleton and updated overview. I'll run three file edits: update overview.md and add multiple new files. I'll now apply the patch.

overview.md+6-0
I'll add the project files for the VS Code extension skeleton under fancy-file-editor: package.json, tsconfig.json, src/extension.ts, src/webview/index.html, README.md, and .vscodeignore, plus a simple .gitignore. I'll create these new files now.

package.json+33-1
Now add tsconfig, src/extension.ts, webview html, README, .gitignore, and .vscodeignore. I will add them in a single patch.

tsconfig.json+14-1
extension.ts
Now add webview index.html (optional) and README and ignore files.

README.md+18-1
.gitignore
.vscodeignore
Checkpoint: updated overview.md and created multiple files under fancy-file-editor. Next I'll run a quick TypeScript build to validate no syntax errors (installing deps not possible here), but I can run tsc if TypeScript is present. However devDependencies aren't installed; run npm run build would fail. Instead, run a quick static check using the repository's TypeScript if available, but safe option is to run 'node -v' or list files. Per instructions, after batches I must give progress update and next steps. I'll now report status and ask whether to proceed with installing deps and running build, or to adjust project structure. I'm going to create a VS Code extension skeleton for the fancy-file-editor subproject and update overview.md to reference it; I'll first summarize what I changed and ask two quick confirmation items before proceeding to install & build.

Checklist (requirements extracted)

Update overview.md to acknowledge new project. — Done
Create a VS Code extension skeleton in the directory where the chatlog lives (fancy-file-editor). — Done (files listed below)
Base the design on the chatlog discussion (custom text editor with webview). — Done (implementation sketch from chatlog used)
What I changed (files added/updated)

Updated:
overview.md — added a short entry pointing to the new subproject docs.
Added new subproject fancy-file-editor:
package.json — basic package manifest with contributes.customEditors.
tsconfig.json — TypeScript config for building to dist.
extension.ts — TypeScript implementation of a CustomTextEditorProvider (textarea prototype, message passing).
README.md — short usage/build notes and caveats.
.gitignore
.vscodeignore
Notes about the current state

The extension skeleton follows the exact minimal example from your chatlog: a custom editor registered for *.tsb and a webview with a <textarea> that posts edits back to the text document.
I inlined the webview HTML in src/extension.ts for simplicity (comment in README recommends extracting assets and using proper CSP for production).
I set main to ./dist/extension.js and added simple build scripts that run tsc -p ./. Dev dependencies are declared but not installed yet.
Lint / quick issues found

The in-repo editor flagged a few markdown/TS lint warnings (these don't block running the extension but point to missing dev deps and small style issues):
src/extension.ts shows "Cannot find module 'vscode' or its type declarations" — expected until you run npm install in the subproject.
Small MD linter flags for inline HTML in README.md and blank-line heading in overview.md — harmless, but I can fix formatting if you want.
Next steps — choose one

Proceed to install dev dependencies and build the extension now (I will run commands in a terminal):
Runs: npm install then npm run build inside fancy-file-editor
Outcome: validates TypeScript compile and produces dist/extension.js.
Or, adjust the skeleton (suggestions I can apply):
Extract webview HTML to src/webview/index.html and wire asWebviewUri usage.
Add a launch.json and vscode debug configuration for easy "Run Extension" from the workspace.
Add a small test using vscode-test or vitest and CI workflow.
Change package manager (pnpm/yarn) or tweak engines.vscode range.
Two confirmations I need before proceeding with build or additional wiring

Do you want me to run npm install and build inside fancy-file-editor now? (Yes / No)
If yes, do you prefer npm (default) or another package manager (pnpm/yarn)?
If you prefer, I can also make the additional improvements (launch config, extracted webview files, simple test, CI). Tell me which of the next steps you'd like and I’ll run the corresponding commands and/or apply the edits.