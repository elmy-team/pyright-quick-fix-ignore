// src/UnusedIgnoreDetector.ts

import * as vscode from 'vscode';

/**
 * Detects unused Pyright/Pylance and type ignore comments and triggers warnings.
 */
export class UnusedIgnoreDetector {
    private unusedIgnoreDiagnostics: vscode.DiagnosticCollection;
    private debounceTimer: NodeJS.Timeout | null = null;
    private debounceDelay: number = 300; // milliseconds

    constructor() {
        this.unusedIgnoreDiagnostics = vscode.languages.createDiagnosticCollection('pyright-unused-ignore');
    }

    /**
     * Activates the Unused Ignore Detector by setting up event listeners.
     * @param context The extension context.
     */
    public activate(context: vscode.ExtensionContext) {
        context.subscriptions.push(this.unusedIgnoreDiagnostics);

        // Initial scan for all open Python documents
        vscode.workspace.textDocuments.forEach(doc => this.updateUnusedIgnores(doc));

        // Listen for document changes to update unused ignores
        const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
            this.debounce(() => this.updateUnusedIgnores(event.document));
        });
        context.subscriptions.push(changeSubscription);

        // Listen for document open events
        const openSubscription = vscode.workspace.onDidOpenTextDocument(doc => {
            this.debounce(() => this.updateUnusedIgnores(doc));
        });
        context.subscriptions.push(openSubscription);

        // Listen for document close events to clear diagnostics
        const closeSubscription = vscode.workspace.onDidCloseTextDocument(doc => {
            this.unusedIgnoreDiagnostics.delete(doc.uri);
        });
        context.subscriptions.push(closeSubscription);

        // Register Code Action Provider for removing unused ignores
        const codeActionProvider = vscode.languages.registerCodeActionsProvider(
            { language: 'python', scheme: 'file' },
            {
                provideCodeActions: this.provideCodeActions.bind(this)
            },
            {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            }
        );
        context.subscriptions.push(codeActionProvider);
    }

    /**
     * Debounces the execution of a function to optimize performance.
     * @param func The function to debounce.
     */
    private debounce(func: () => void) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(func, this.debounceDelay);
    }

    /**
     * Updates the unused ignore diagnostics for a given document.
     * @param document The text document to scan.
     */
    private updateUnusedIgnores(document: vscode.TextDocument) {
        if (document.languageId !== 'python') {
            this.unusedIgnoreDiagnostics.delete(document.uri);
            return;
        }

        const diagnostics = this.getAllDiagnostics(document);
        const ignoreComments = this.getAllIgnoreComments(document);
        const diagnosticsMap = this.mapDiagnosticsByCode(diagnostics);
        const severity = this.getUnusedIgnoreSeverity();

        const unusedDiagnostics: vscode.Diagnostic[] = [];

        ignoreComments.forEach(ignore => {
            const unusedCodes: string[] = [];

            if (ignore.type === 'pyright') {
                ignore.codes.forEach(code => {
                    if (!diagnosticsMap.has(code)) {
                        unusedCodes.push(code);
                    }
                });

                if (unusedCodes.length > 0) {
                    // Create a diagnostic for the unused pyright ignore codes
                    const range = new vscode.Range(
                        ignore.line,
                        ignore.startColumn,
                        ignore.line,
                        ignore.endColumn
                    );

                    const message = `Unused Pyright ignore codes: ${unusedCodes.join(', ')}`;
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        severity
                    );

                    diagnostic.source = 'pyright-ignore-extension';
                    unusedDiagnostics.push(diagnostic);
                }
            } else if (ignore.type === 'type') {
                if (ignore.codes.length > 0) {
                    // Specific error codes
                    ignore.codes.forEach(code => {
                        if (!diagnosticsMap.has(code)) {
                            unusedCodes.push(code);
                        }
                    });

                    if (unusedCodes.length > 0) {
                        // Create a diagnostic for the unused type ignore codes
                        const range = new vscode.Range(
                            ignore.line,
                            ignore.startColumn,
                            ignore.line,
                            ignore.endColumn
                        );

                        const message = `Unused type ignore codes: ${unusedCodes.join(', ')}`;
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            message,
                            severity
                        );

                        diagnostic.source = 'pyright-ignore-extension';
                        unusedDiagnostics.push(diagnostic);
                    }
                } else {
                    // No specific codes; check if any type diagnostics exist on this line
                    const hasTypeDiagnostics = this.hasTypeDiagnostics(document, ignore.line);

                    if (!hasTypeDiagnostics) {
                        // The type ignore is unused
                        const range = new vscode.Range(
                            ignore.line,
                            ignore.startColumn,
                            ignore.line,
                            ignore.endColumn
                        );

                        const message = `Unused type ignore comment. No type errors to ignore on this line.`;
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            message,
                            severity
                        );

                        diagnostic.source = 'pyright-ignore-extension';
                        unusedDiagnostics.push(diagnostic);
                    }
                }
            }
        });

        this.unusedIgnoreDiagnostics.set(document.uri, unusedDiagnostics);
    }

    /**
     * Extracts all ignore comments (both pyright and type) from the document.
     * @param document The text document to scan.
     * @returns An array of IgnoreComment objects.
     */
    private getAllIgnoreComments(document: vscode.TextDocument): IgnoreComment[] {
        const ignores: IgnoreComment[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;

            // Match pyright: ignore[...] comments
            const pyrightRegex = /#\s*pyright:\s*ignore\[(.*?)\]/gi;
            let match: RegExpExecArray | null;
            while ((match = pyrightRegex.exec(line)) !== null) {
                const codes = match[1]
                    .split(',')
                    .map(code => code.trim())
                    .filter(code => code.length > 0);

                ignores.push({
                    type: 'pyright',
                    line: i,
                    startColumn: match.index,
                    endColumn: match.index + match[0].length,
                    codes: codes
                });
            }

            // Match type: ignore[...] or type: ignore comments
            const typeIgnoreRegex = /#\s*type:\s*ignore(?:\[(.*?)\])?/gi;
            while ((match = typeIgnoreRegex.exec(line)) !== null) {
                const codes = match[1]
                    ? match[1].split(',')
                          .map(code => code.trim())
                          .filter(code => code.length > 0)
                    : [];

                ignores.push({
                    type: 'type',
                    line: i,
                    startColumn: match.index,
                    endColumn: match.index + match[0].length,
                    codes: codes
                });
            }
        }

        return ignores;
    }

    /**
     * Retrieves all current Pyright/Pylance diagnostics from the active document.
     * @param document The text document to scan.
     * @returns An array of VS Code Diagnostic objects.
     */
    private getAllDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
        const allDiagnostics = vscode.languages.getDiagnostics(document.uri);
        const pyrightDiagnostics = allDiagnostics.filter(diagnostic =>
            diagnostic.source?.toLowerCase() === 'pyright' ||
            diagnostic.source?.toLowerCase() === 'pylance' ||
            diagnostic.source?.toLowerCase() === 'mypy' || // Include mypy if desired
            diagnostic.source?.toLowerCase() === 'type checker' // Adjust based on actual sources
        );
        return pyrightDiagnostics;
    }

    /**
     * Maps diagnostics by their error codes for quick lookup.
     * @param diagnostics An array of VS Code Diagnostic objects.
     * @returns A Map where keys are error codes and values are arrays of diagnostics.
     */
    private mapDiagnosticsByCode(diagnostics: vscode.Diagnostic[]): Map<string, vscode.Diagnostic[]> {
        const map = new Map<string, vscode.Diagnostic[]>();

        diagnostics.forEach(diagnostic => {
            let code: string;
            if (typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number') {
                code = String(diagnostic.code);
            } else if (typeof diagnostic.code === 'object' && diagnostic.code !== null) {
                code = diagnostic.code.value ? String(diagnostic.code.value) : 'unknown';
            } else {
                code = 'unknown';
            }

            if (!map.has(code)) {
                map.set(code, []);
            }
            map.get(code)?.push(diagnostic);
        });

        return map;
    }

    /**
     * Checks if there are any type-related diagnostics on a given line.
     * @param document The text document to scan.
     * @param line The line number to check.
     * @returns True if type diagnostics exist on the line, else false.
     */
    private hasTypeDiagnostics(document: vscode.TextDocument, line: number): boolean {
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        return diagnostics.some(diagnostic => {
            if (diagnostic.range.start.line !== line) {
                return false;
            }
            const source = diagnostic.source?.toLowerCase();
            return source === 'pyright' || source === 'pylance' || source === 'mypy' || source === 'type checker';
        });
    }

    /**
     * Retrieves the severity level for unused ignore diagnostics from configuration.
     * @returns The DiagnosticSeverity based on user settings.
     */
    private getUnusedIgnoreSeverity(): vscode.DiagnosticSeverity {
        const config = vscode.workspace.getConfiguration('pyrightIgnoreExtension');
        const severity = config.get<string>('unusedIgnoreSeverity', 'Warning');

        switch (severity.toLowerCase()) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'information':
                return vscode.DiagnosticSeverity.Information;
            case 'hint':
                return vscode.DiagnosticSeverity.Hint;
            case 'warning':
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    /**
     * Provides Code Actions to remove unused ignore comments.
     * @param document The current text document.
     * @param range The range in which the command was invoked.
     * @param context Context carrying additional information about the request.
     * @param token A cancellation token.
     * @returns An array of Code Actions or undefined.
     */
    private provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {

        const actions: vscode.CodeAction[] = [];

        context.diagnostics.forEach(diagnostic => {
            if (diagnostic.source !== 'pyright-ignore-extension') {
                return;
            }

            // Create a Code Action to remove the unused ignore comment
            const removeIgnoreAction = new vscode.CodeAction(
                `Remove unused ignore comment`,
                vscode.CodeActionKind.QuickFix
            );

            const edit = new vscode.WorkspaceEdit();
            edit.delete(document.uri, diagnostic.range);

            removeIgnoreAction.edit = edit;
            removeIgnoreAction.diagnostics = [diagnostic];
            removeIgnoreAction.isPreferred = true;

            actions.push(removeIgnoreAction);
        });

        return actions.length > 0 ? actions : undefined;
    }
}

/**
 * Represents an ignore comment in the document.
 */
interface IgnoreComment {
    type: 'pyright' | 'type';
    line: number;
    startColumn: number;
    endColumn: number;
    codes: string[];
}
