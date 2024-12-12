# Pyright Quick Fix Ignore

A Visual Studio Code extension that enhances Pyright quick fixes by suggesting specific `# pyright: ignore[errorCode]` directives in addition to the generic `# type: ignore` suggested by Pylance. Additionally, it detects and warns about unused ignore comments, providing quick fixes to remove them, ensuring a clean and maintainable codebase.

## Features

- **Supports Python Files Using Pyright:** Seamlessly integrates with Python projects utilizing Pyright for static type checking.
- **Easy-to-Use Quick Fix Suggestions:** Trigger quick fixes using `Ctrl+.` (Windows/Linux) or `Cmd+.` (macOS) to manage ignore comments efficiently.
- **Provides Specific Pyright Ignore Directives:** Suggests `# pyright: ignore[<errorCode>]` for targeted suppression of specific diagnostics.
- **Add Ignore Comments:** Quickly add `# pyright: ignore[...]` comments to suppress specific diagnostics.
- **Append to Existing Ignores:** If an ignore comment already exists, the extension appends new error codes without duplication.
- **Supports Multiple Diagnostics:** Handles multiple Pyright/Pylance diagnostics on the same line.
- **Detects Unused Ignore Comments:** Automatically identifies unused `# pyright: ignore[...]` and `# type: ignore` comments.
- **Quick Fix to Remove Unused Ignores:** Provides a quick fix to automatically remove unused ignore comments, maintaining code cleanliness.
- **Customizable Severity Levels:** Configure the severity of warnings for unused ignore comments (`Error`, `Warning`, `Information`, `Hint`).

## Installation

You can install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/vscode).

1. **Open VS Code.**
2. **Navigate to Extensions:** Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS).
3. **Search for "Pyright Quick Fix Ignore".**
4. **Click "Install".**

## Usage

### Adding/Updating Pyright Ignore Comments

1. **Trigger Quick Fix:**
   - Open a Python file with Pyright or Pylance diagnostics.
   - Place the cursor on the diagnostic line.
   - Trigger the quick fix by clicking the lightbulb icon or pressing `Ctrl+.` (Windows/Linux) or `Cmd+.` (macOS).

2. **Select Ignore Action:**
   - Choose the `Add # pyright: ignore[<errorCode>]` option from the quick fix suggestions.
   - If an ignore comment already exists, the new error code will be appended without duplication.

### Detecting and Removing Unused Ignore Comments

1. **Automatic Detection:**
   - The extension scans your Python files and highlights any unused `# pyright: ignore[...]` or `# type: ignore` comments with warnings.

2. **Quick Fix to Remove Unused Ignores:**
   - **Identify the Warning:**
     - Unused ignore comments will be underlined with a warning, and a diagnostic message will appear indicating the unused codes.

   - **Trigger Quick Fix:**
     - Place the cursor on the warning underline.
     - Trigger the quick fix by clicking the lightbulb icon or pressing `Ctrl+.` (Windows/Linux) or `Cmd+.` (macOS).

   - **Select Remove Action:**
     - Choose the `Remove unused ignore comment` option from the quick fix suggestions.
     - The unused ignore comment will be automatically removed from the code.

### Configuration

Customize the extension's behavior via VS Code settings.

1. **Open Settings:**
   - Go to `File` > `Preferences` > `Settings` (Windows/Linux) or `Code` > `Preferences` > `Settings` (macOS).

2. **Search for `Pyright Quick Fix Ignore`:**
   - Configure the following settings:

   - **Enable/Disable Unused Ignore Warnings:**
     - `pyrightQuickFixIgnore.warnOnUnusedIgnores` (Default: `true`)
     - **Description:** Enable or disable warnings for unused Pyright and type ignore comments.

   - **Set Severity Level for Warnings:**
     - `pyrightQuickFixIgnore.unusedIgnoreSeverity` (Options: `Error`, `Warning`, `Information`, `Hint`; Default: `Warning`)
     - **Description:** Set the severity level for diagnostics related to unused ignore comments.

### Example Configuration

```json
{
    "pyrightQuickFixIgnore.warnOnUnusedIgnores": true,
    "pyrightQuickFixIgnore.unusedIgnoreSeverity": "Warning"
}

## License

[MIT](LICENSE)
