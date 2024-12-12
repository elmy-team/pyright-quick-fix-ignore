// src/extension.ts

import * as vscode from 'vscode';
import { PyrightIgnoreQuickFixProvider } from './PyrightIgnoreQuickFixProvider';
import { UnusedIgnoreDetector } from './UnusedIgnoreDetector';

/**
 * Activates the extension.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Pyright Quick Fix Ignore Extension activated');

    // Register the Code Action Provider for Python files
    const quickFixProvider = vscode.languages.registerCodeActionsProvider(
        { language: 'python', scheme: 'file' }, // Scope to Python files in the filesystem
        new PyrightIgnoreQuickFixProvider(),
        {
            providedCodeActionKinds: PyrightIgnoreQuickFixProvider.providedCodeActionKinds
        }
    );

    context.subscriptions.push(quickFixProvider);

    // Initialize and activate the Unused Ignore Detector
    const unusedIgnoreDetector = new UnusedIgnoreDetector();
    unusedIgnoreDetector.activate(context);

    // Register Commands
    const addIgnoreCommand = vscode.commands.registerCommand('pyright-ignore-extension.addIgnore', addIgnoreHandler);
    const removeUnusedIgnoreCommand = vscode.commands.registerCommand('pyright-ignore-extension.removeUnusedIgnore', removeUnusedIgnoreHandler);

    context.subscriptions.push(addIgnoreCommand, removeUnusedIgnoreCommand);
}

/**
 * Handler for adding ignore comments.
 * @param uri The document URI.
 * @param diagnostic The diagnostic to ignore.
 */
async function addIgnoreHandler(uri: vscode.Uri, diagnostic: vscode.Diagnostic) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const position = diagnostic.range.end;

    // Determine the line where the diagnostic is
    const line = document.lineAt(diagnostic.range.start.line);
    const text = line.text;

    // Check if an ignore comment already exists
    const ignoreCommentRegex = /# pyright: ignore\[(.*?)\]/;
    const match = ignoreCommentRegex.exec(text);

    if (match) {
        // Append the new error code if it's not already present
        const existingCodes = match[1].split(',').map(code => code.trim());
        const newErrorCode = getDiagnosticCode(diagnostic);
        if (!existingCodes.includes(newErrorCode)) {
            existingCodes.push(newErrorCode);
            const newIgnoreComment = `# pyright: ignore[${existingCodes.join(', ')}]`;
            const newText = text.replace(ignoreCommentRegex, newIgnoreComment);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, line.range, newText);
            await vscode.workspace.applyEdit(edit);
        }
    } else {
        // Add a new ignore comment at the end of the line
        const newIgnoreComment = ` # pyright: ignore[${getDiagnosticCode(diagnostic)}]`;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(diagnostic.range.start.line, text.length), newIgnoreComment);
        await vscode.workspace.applyEdit(edit);
    }
}

/**
 * Handler for removing unused ignore comments.
 * @param uri The document URI.
 * @param diagnostic The diagnostic indicating an unused ignore.
 */
async function removeUnusedIgnoreHandler(uri: vscode.Uri, diagnostic: vscode.Diagnostic) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const line = document.lineAt(diagnostic.range.start.line);
    const text = line.text;

    // Remove the entire ignore comment
    const ignoreCommentRegex = /# pyright: ignore\[(.*?)\]/;
    const newText = text.replace(ignoreCommentRegex, '').trimEnd();

    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, line.range, newText);
    await vscode.workspace.applyEdit(edit);
}

/**
 * Retrieves the error code from a diagnostic.
 * @param diagnostic The diagnostic object.
 * @returns The error code as a string or 'unknown'.
 */
function getDiagnosticCode(diagnostic: vscode.Diagnostic): string {
    let errorCode: string;

    if (typeof diagnostic.code === 'object' && diagnostic.code !== null && 'value' in diagnostic.code) {
        errorCode = String(diagnostic.code.value);
    } else if (typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number') {
        errorCode = String(diagnostic.code);
    } else {
        errorCode = 'unknown';
    }

    return errorCode;
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
    console.log('Pyright Quick Fix Ignore Extension deactivated');
}
