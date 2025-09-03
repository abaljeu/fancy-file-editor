# Architecture Overview

This project is built on the foundational elements required for a custom VS Code text editor.  It provides a editing experience for `.tsb` files, leveraging VS Code's extensibility and webview capabilities.

## VSCode extension basics

- **VS Code Extension API**: Uses the official `vscode` API and typings for extension development.
- **Custom Editor Registration**: Registers a custom editor provider (`fancy-file-editor.myTextEditor`) for `.tsb` files using `registerCustomEditorProvider`.
- **Webview-based UI**: Implements `CustomTextEditorProvider` to provide a webview-based editing experience, handling file content and user edits via message passing.
- **Extension Manifest**: Declares the custom editor and activation events in `package.json` under `contributes.customEditors` and `activationEvents`.

## next section
