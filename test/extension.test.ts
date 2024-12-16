import * as vscode from 'vscode';

describe('Pyright Quick Fix Ignore Extension Test Suite', () => {
    const mockDocumentUri = vscode.Uri.parse('file:///mockFile.py');

    // Helper to simulate an active text editor
    const setActiveTextEditor = (mockContent: string) => {
        const mockDocument = {
            uri: mockDocumentUri,
            fileName: 'mockFile.py',
            languageId: 'python',
            getText: jest.fn(() => mockContent),
            lineAt: jest.fn((line: number) => ({
                text: mockContent.split('\n')[line],
                range: { start: { line }, end: { line } },
            })),
        } as unknown as vscode.TextDocument;

        const mockEditor = {
            document: mockDocument,
        } as unknown as vscode.TextEditor;

        (vscode.window as any).activeTextEditor = mockEditor;
    };

    // Helper to mock diagnostics
    const mockDiagnostics = (diagnostics: vscode.Diagnostic[]) => {
        (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue(diagnostics);
    };

    // Mock command execution
    const mockCommandExecution = () => {
        (vscode.commands.executeCommand as jest.Mock).mockImplementation(async (command, ...args) => {
            if (command === 'pyright-ignore-extension.addIgnore') {
                const [uri, diagnostic] = args;
                const line = diagnostic.range.start.line;
                console.log(`Adding ignore for line ${line} in ${uri.fsPath}`);
            } else if (command === 'pyright-ignore-extension.removeUnusedIgnore') {
                const [uri, diagnostic] = args;
                const line = diagnostic.range.start.line;
                console.log(`Removing unused ignore for line ${line} in ${uri.fsPath}`);
            }
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();

        // Mock VSCode APIs
        (vscode.languages.getDiagnostics as jest.Mock) = jest.fn(() => []);
        (vscode.commands.executeCommand as jest.Mock) = jest.fn();
        (vscode.workspace.openTextDocument as jest.Mock) = jest.fn(async (uri) => ({
            uri,
            fileName: uri.fsPath,
        }));
        (vscode.window.showTextDocument as jest.Mock) = jest.fn();
        (vscode.workspace.applyEdit as jest.Mock) = jest.fn();
    });

    test('Quickfix for multiple issues on the same line (multipleIssuesNoIgnoreComment)', async () => {
        setActiveTextEditor('x = 42  # Some comment with an issue');

        mockDiagnostics([
            {
                message: 'Expected type "str" but got "int" instead.',
                range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
                severity: vscode.DiagnosticSeverity.Error,
                source: 'pyright',
                code: 'reportGeneralTypeIssues',
            },
            {
                message: 'Unused variable "x".',
                range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
                severity: vscode.DiagnosticSeverity.Warning,
                source: 'pyright',
                code: 'reportUnusedVariable',
            },
        ]);

        mockCommandExecution();

        await vscode.commands.executeCommand('pyright-ignore-extension.addIgnore', mockDocumentUri, {
            message: 'Expected type "str" but got "int" instead.',
            range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
            severity: vscode.DiagnosticSeverity.Error,
            source: 'pyright',
            code: 'reportGeneralTypeIssues',
        });

        await vscode.commands.executeCommand('pyright-ignore-extension.addIgnore', mockDocumentUri, {
            message: 'Unused variable "x".',
            range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
            severity: vscode.DiagnosticSeverity.Warning,
            source: 'pyright',
            code: 'reportUnusedVariable',
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
            'pyright-ignore-extension.addIgnore',
            mockDocumentUri,
            expect.objectContaining({ message: 'Expected type "str" but got "int" instead.' })
        );
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
            'pyright-ignore-extension.addIgnore',
            mockDocumentUri,
            expect.objectContaining({ message: 'Unused variable "x".' })
        );
    });

    test('Handle multiple unused ignore comments on the same line (noIssueMultipleIgnoreCommentsAllUnused)', async () => {
        setActiveTextEditor('x = 42  # pyright: ignore[reportGeneralTypeIssues, reportUnusedVariable]');

        mockDiagnostics([
            {
                message: 'Unused Pyright ignore[reportGeneralTypeIssues]',
                range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
                severity: vscode.DiagnosticSeverity.Warning,
                source: 'pyright',
            },
            {
                message: 'Unused Pyright ignore[reportUnusedVariable]',
                range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
                severity: vscode.DiagnosticSeverity.Warning,
                source: 'pyright',
            },
        ]);

        mockCommandExecution();

        await vscode.commands.executeCommand('pyright-ignore-extension.removeUnusedIgnore', mockDocumentUri, {
            message: 'Unused Pyright ignore[reportGeneralTypeIssues]',
            range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
            severity: vscode.DiagnosticSeverity.Warning,
            source: 'pyright',
        });

        await vscode.commands.executeCommand('pyright-ignore-extension.removeUnusedIgnore', mockDocumentUri, {
            message: 'Unused Pyright ignore[reportUnusedVariable]',
            range: { start: { line: 0 }, end: { line: 0 } } as vscode.Range,
            severity: vscode.DiagnosticSeverity.Warning,
            source: 'pyright',
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
            'pyright-ignore-extension.removeUnusedIgnore',
            mockDocumentUri,
            expect.objectContaining({ message: 'Unused Pyright ignore[reportGeneralTypeIssues]' })
        );
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
            'pyright-ignore-extension.removeUnusedIgnore',
            mockDocumentUri,
            expect.objectContaining({ message: 'Unused Pyright ignore[reportUnusedVariable]' })
        );
    });
});
