import * as vscode from 'vscode';

export async function openDocument(filePath: string): Promise<vscode.TextDocument> {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);
    return doc;
}

export function setDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
    const diagCollection = vscode.languages.createDiagnosticCollection('test');
    diagCollection.set(uri, diagnostics);
}

export async function applyCodeAction(doc: vscode.TextDocument, actionTitle: string) {
    const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
        'vscode.executeCodeActionProvider',
        doc.uri,
        new vscode.Range(0,0,doc.lineCount,0)
    );
    const action = actions?.find(a => a.title === actionTitle);
    if (action?.edit) {
        await vscode.workspace.applyEdit(action.edit);
    }
    if (action?.command) {
        await vscode.commands.executeCommand(action.command.command, ...(action.command.arguments || []));
    }
}

export function getDocumentText(doc: vscode.TextDocument): string {
    return doc.getText();
}
