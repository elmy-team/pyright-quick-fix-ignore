// src/PyrightIgnoreQuickFixProvider.ts

import * as vscode from 'vscode';

/**
 * Provides code actions (quick fixes) for adding/updating Pyright ignore comments.
 */
export class PyrightIgnoreQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    /**
     * Registers the Code Action Provider.
     * @param document The current text document.
     * @param range The range in the document.
     * @param context The context of the code action.
     * @param token A cancellation token.
     * @returns An array of code actions.
     */
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (
                diagnostic.source === 'pyright' ||
                diagnostic.source === 'Pylance'
            ) {
                const errorCode = this.getDiagnosticCode(diagnostic);
                if (errorCode !== 'unknown') {
                    const action = new vscode.CodeAction(
                        `Add # pyright: ignore[${errorCode}]`,
                        vscode.CodeActionKind.QuickFix
                    );
                    action.command = {
                        command: 'pyright-ignore-extension.addIgnore',
                        title: 'Add Pyright Ignore Comment',
                        arguments: [document.uri, diagnostic]
                    };
                    actions.push(action);
                }
            }
        }

        return actions;
    }

    /**
     * Retrieves the error code from a diagnostic.
     * @param diagnostic The diagnostic object.
     * @returns The error code as a string or 'unknown'.
     */
    private getDiagnosticCode(diagnostic: vscode.Diagnostic): string {
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
}
