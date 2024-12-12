// src/extension.ts

import * as vscode from 'vscode';
import { PyrightIgnoreQuickFixProvider } from './PyrightIgnoreQuickFixProvider';
import { UnusedIgnoreDetector } from './UnusedIgnoreDetector';

/**
 * Activates the extension.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Pyright Quick Fix Ignore Suggestion Extension activated');

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
}

/**
 * Deactivates the extension.
 */
export function deactivate() {
    console.log('Pyright Quick Fix Ignore Suggestion Extension deactivated');
}
