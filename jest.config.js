module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.ts'],
    moduleNameMapper: {
        '^vscode$': '<rootDir>/__mocks__/vscode.js',
    },
};