# Project Overview

The Fancy File Editor project is a prototype Visual Studio Code extension that provides a custom text editor for a simple, text-based filetype (with `.tsb` extension). Its goal is to enhance the editing experience for these files by offering specialized UI and features beyond the default VS Code text editor, serving as a foundation for more advanced custom editor capabilities.

The content will be custom rendering, not the standard monospace editor.
The format it handles will be .tsb extension, which is Tab Separated Values, but there are extra features to the interpretation of a value. It also will be geared to handle other filetypes by the renderer converting internally to a representation of tsb.

The structure of this project shall be in [[architecture.md]] which is to be updated whenever it varies from the actual code.
Testing is described in [[test-organization.md]] and [[testing.md]], but this should be consolidated into one shorter document.
