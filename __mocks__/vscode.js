let activeTextEditor = null;

module.exports = {
    window: {
        showInformationMessage: jest.fn(),
        get activeTextEditor() {
            return activeTextEditor;
        },
        set activeTextEditor(editor) {
            activeTextEditor = editor;
        },
    },
    workspace: {
        openTextDocument: jest.fn(async (path) => ({
            uri: `file://${path}`,
            fileName: path,
            getText: jest.fn(() => 'mock file content'), // Mock file content
        })),
        applyEdit: jest.fn(),
    },
    languages: {
        getDiagnostics: jest.fn(() => []),
    },
    commands: {
        executeCommand: jest.fn(async () => {}),
    },
};
