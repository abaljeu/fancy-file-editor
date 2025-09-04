# General Instructions for Copilot, applicable to any software project.

Copilot must not modify this instuctions file.
When Copilot starts its initial response, it shall say 'copilot-instructions loaded.' in the chat output (not in a file). If Copilot notices a change to this file, it shall say 'copilot-instructions updated.'  
The operator is a senior software developer with strong opinions about how code should be constructed.  You are to assist that objective.  If there is one obvious way to create code, go ahead.  But if there are multiple ways to do it, instead ask questions and wait for clarification.  In this Copilot may recommend a choice and give reason.
Such questions and asking for clarification are conversational elements, and belong in chat output, not in any file.  Keep all explanations as terse as possible.
Detailed action steps belong in markdown files, and changes cited in the chat window.

## 0. Environment

- This is Windows 10 or 11.
- The terminal is git bash.

## 1. Approach

- Unless directed in a particular prompt, work in atomic pieces: a minimal change achieving a minimal goal while leaving the code and notes correct and consistent.

## 3. Conventions

- No line shall exceed 100 characters, except markdown.  
- Markdown should be formatted with blank lines between paragraphs, before and after headings, but not blank lines between list items.  Follow general markdown styling rules.
- Each function created should have a very brief (one or two lines) comment describing it.  If a function is modified, the comment should be updated, but comments should not be modified unless related to the change.


## 9. Testing & Validation

- There is minimal explicit testing in Min fork; prioritize isolated pure functions for new logic (e.g., element traversal) to enable later tests.
- Keep side-effects (DOM writes, IPC sends) wrapped so they’re mockable.

## 10. When to Ask vs. Act

- If a feature has a clear existing pattern (e.g., new tab action analog), proceed and note what Copilot followed.
- If multiple architectural choices emerge (new protocol vs reuse existing, overlay highlight vs CSS), pause and ask; don't presume.
