// src/PyrightIgnoreQuickFixProvider.ts

import * as vscode from 'vscode';

/**
 * Provides Quick Fix actions for Pyright/Pylance diagnostics to add/update ignore comments.
 */
export class PyrightIgnoreQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    /**
     * Provides code actions for diagnostics related to Pyright or Pylance.
     * @param document The current text document.
     * @param range The range in which the command was invoked.
     * @param context Context carrying additional information about the request.
     * @param token A cancellation token.
     * @returns An array of code actions or undefined.
     */
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {

        // Filter diagnostics to include only those from Pyright or Pylance
        const pyrightDiagnostics = context.diagnostics.filter(diagnostic =>
            diagnostic.source?.toLowerCase() === 'pyright' ||
            diagnostic.source?.toLowerCase() === 'pylance'
        );

        if (pyrightDiagnostics.length === 0) {
            return; // No relevant diagnostics to handle
        }

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of pyrightDiagnostics) {
            // Extract the error code correctly
            let errorCode: string;
            if (typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number') {
                errorCode = String(diagnostic.code);
            } else if (typeof diagnostic.code === 'object' && diagnostic.code !== null) {
                // Assuming CodeDescription has a 'value' property
                errorCode = diagnostic.code.value ? String(diagnostic.code.value) : 'unknown';
            } else {
                errorCode = 'unknown';
            }

            // Log diagnostic code type and value for debugging purposes
            console.log('Diagnostic Code:', diagnostic.code, 'Type:', typeof diagnostic.code);

            // Define the ignore comment regex
            const ignoreRegex = /#\s*pyright:\s*ignore\[(.*?)\]/i;

            // Get the line where the diagnostic is reported
            const line = document.lineAt(diagnostic.range.start.line);
            const lineText = line.text;

            const match = ignoreRegex.exec(lineText);
            let newIgnoreComment: string;
            let edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();

            if (match) {
                // Existing ignore comment found
                const existingCodes = match[1]
                    .split(',')
                    .map(code => code.trim())
                    .filter(code => code.length > 0);

                if (existingCodes.includes(errorCode)) {
                    // The error code is already ignored; no action needed
                    continue;
                }

                // Append the new error code
                const updatedCodes = [...existingCodes, errorCode].sort((a, b) => a.localeCompare(b));
                newIgnoreComment = `# pyright: ignore[${updatedCodes.join(', ')}]`;

                // Replace the existing ignore comment with the updated one
                const commentStartIndex = match.index;
                edit.replace(
                    document.uri,
                    new vscode.Range(
                        line.lineNumber,
                        commentStartIndex,
                        line.lineNumber,
                        commentStartIndex + match[0].length
                    ),
                    newIgnoreComment
                );
            } else {
                // No existing ignore comment; append a new one
                newIgnoreComment = `# pyright: ignore[${errorCode}]`;
                edit.insert(
                    document.uri,
                    new vscode.Position(line.lineNumber, lineText.length),
                    `  ${newIgnoreComment}`
                );
            }

            // Create a Code Action to perform the edit
            const pyrightIgnoreAction = new vscode.CodeAction(
                `Add ${newIgnoreComment}`,
                vscode.CodeActionKind.QuickFix
            );

            pyrightIgnoreAction.edit = edit;

            // Associate the fix with the specific diagnostic
            pyrightIgnoreAction.diagnostics = [diagnostic];

            actions.push(pyrightIgnoreAction);
        }

        return actions.length > 0 ? actions : undefined;
    }
}
