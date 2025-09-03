# Fancy File Editor

Prototype VS Code extension that demonstrates a Custom Text Editor for files matching `*.tsb`.

This project is a minimal skeleton intended to be extended. It uses a webview with a <textarea>
for quick prototyping.

How to build

1. Install dev deps: `npm install` (run from c:\dev\amble\fancy-file-editor)
2. Build: `npm run build`
3. Launch from VS Code using the "Run Extension" launch target.

Notes

- This is a prototype; the webview HTML is inlined in `src/extension.ts` to keep the example compact.
- When extending, serve webview assets through `webview.asWebviewUri` and add a Content-Security-Policy.
