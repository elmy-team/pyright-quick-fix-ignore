import * as vscode from 'vscode';

class UnusedIgnoreDetector {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('pyright-unused-ignore');
    }

    public activate(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this),
            vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this),
            vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this)
        );
    }

    private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
        this.processDocument(event.document);
    }

    private onDidOpenTextDocument(document: vscode.TextDocument) {
        this.processDocument(document);
    }

    private onDidCloseTextDocument(document: vscode.TextDocument) {
        this.diagnosticCollection.delete(document.uri);
    }

    public processDocument(document: vscode.TextDocument) {
        if (document.languageId !== 'python') return;

        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const unusedIgnores = diagnostics.filter(d => 
            d.message.includes('Unused Pyright ignore') || d.message.includes('Unused "type: ignore"')
        );
        this.diagnosticCollection.set(document.uri, unusedIgnores.length ? unusedIgnores : []);
    }

    public dispose() {
        this.diagnosticCollection.dispose();
    }
}

class PyrightIgnoreQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            const source = diagnostic.source?.toLowerCase();
            if (source === 'pyright' || source === 'pylance') {
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

    private getDiagnosticCode(diagnostic: vscode.Diagnostic): string {
        if (typeof diagnostic.code === 'object' && diagnostic.code !== null && 'value' in diagnostic.code) {
            return String(diagnostic.code.value);
        } else if (typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number') {
            return String(diagnostic.code);
        } else {
            return 'unknown';
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Pyright Quick Fix Ignore Extension activated');

    const quickFixProvider = vscode.languages.registerCodeActionsProvider(
        { language: 'python', scheme: 'file' },
        new PyrightIgnoreQuickFixProvider(),
        { providedCodeActionKinds: PyrightIgnoreQuickFixProvider.providedCodeActionKinds }
    );

    context.subscriptions.push(quickFixProvider);

    const unusedIgnoreDetector = new UnusedIgnoreDetector();
    unusedIgnoreDetector.activate(context);

    const addIgnoreCommand = vscode.commands.registerCommand('pyright-ignore-extension.addIgnore', addIgnoreHandler);
    const removeUnusedIgnoreCommand = vscode.commands.registerCommand('pyright-ignore-extension.removeUnusedIgnore', removeUnusedIgnoreHandler);

    context.subscriptions.push(addIgnoreCommand, removeUnusedIgnoreCommand, { dispose: () => unusedIgnoreDetector.dispose() });
}

async function addIgnoreHandler(uri: vscode.Uri, diagnostic: vscode.Diagnostic) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    const line = document.lineAt(diagnostic.range.start.line);
    const ignoreCommentRegex = /# pyright:\s*ignore\[(.*?)\]/;
    const match = ignoreCommentRegex.exec(line.text);
    const newErrorCode = getDiagnosticCode(diagnostic);

    if (match) {
        const existingCodes = match[1].split(',').map(c => c.trim());
        if (!existingCodes.includes(newErrorCode)) {
            existingCodes.push(newErrorCode);
            const newComment = `# pyright: ignore[${existingCodes.join(', ')}]`;
            await applyEdit(uri, line, line.text.replace(ignoreCommentRegex, newComment));
        }
    } else {
        const newComment = ` # pyright: ignore[${newErrorCode}]`;
        await applyEdit(uri, line, line.text.trimEnd() + newComment);
    }
}

async function removeUnusedIgnoreHandler(uri: vscode.Uri, diagnostic: vscode.Diagnostic) {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    const line = document.lineAt(diagnostic.range.start.line);

    // Regexes to remove either pyright ignore or type ignore comments
    const pyrightIgnoreRegex = /# pyright:\s*ignore\[.*?\]/;
    const typeIgnoreRegex = /# type:\s*ignore(\b|$)/;

    let newText = line.text;
    newText = newText.replace(pyrightIgnoreRegex, '').replace(typeIgnoreRegex, '').trimEnd();

    await applyEdit(uri, line, newText);
}

function getDiagnosticCode(diagnostic: vscode.Diagnostic): string {
    if (typeof diagnostic.code === 'object' && diagnostic.code !== null && 'value' in diagnostic.code) {
        return String(diagnostic.code.value);
    } else if (typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number') {
        return String(diagnostic.code);
    } else {
        return 'unknown';
    }
}

async function applyEdit(uri: vscode.Uri, line: vscode.TextLine, newText: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, line.range, newText);
    await vscode.workspace.applyEdit(edit);
}

export function deactivate() {
    console.log('Pyright Quick Fix Ignore Extension deactivated');
}
