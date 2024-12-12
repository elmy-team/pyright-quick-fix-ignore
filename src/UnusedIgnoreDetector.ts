// src/UnusedIgnoreDetector.ts

import * as vscode from 'vscode';

/**
 * Detects and manages unused Pyright ignore comments.
 */
export class UnusedIgnoreDetector {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('pyright-unused-ignore');
    }

    /**
     * Activates the UnusedIgnoreDetector.
     * @param context The extension context.
     */
    public activate(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this),
            vscode.workspace.onDidOpenTextDocument(this.onDidChangeTextDocument, this)
        );
    }

    /**
     * Handles text document changes.
     * @param event The text document change event.
     */
    private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
        this.processDocument(event.document);
    }

    /**
     * Processes a text document to find unused ignore comments.
     * @param document The text document.
     */
    public processDocument(document: vscode.TextDocument) {
        if (document.languageId !== 'python') {
            return;
        }

        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const unusedIgnores: vscode.Diagnostic[] = diagnostics.filter(diagnostic => {
            return diagnostic.message.includes('Unused Pyright ignore');
        });

        this.diagnosticCollection.set(document.uri, unusedIgnores);
    }
}
