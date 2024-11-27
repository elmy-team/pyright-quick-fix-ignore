# Pyright Quick Fix Ignore

A Visual Studio Code extension that enhances Pyright quick fixes by suggesting specific `# pyright: ignore[errorCode]` directives in addition to the generic `# type: ignore` suggested by Pylance

## Features

- Supports Python files using Pyright.
- Easy-to-use quick fix suggestions (`Ctrl+.` or `Cmd+.`).
- Provides specific Pyright ignore directives for better clarity.
- **Add Ignore Comments:** Quickly add `# pyright: ignore[...]` comments to suppress specific diagnostics.
- **Append to Existing Ignores:** If an ignore comment already exists, the extension appends new error codes without duplication.
- **Supports Multiple Diagnostics:** Handles multiple Pyright/Pylance diagnostics on the same line.

## Usage

1. **Trigger Quick Fix:**
   - Open a Python file with Pyright or Pylance diagnostics.
   - Place the cursor on the diagnostic line.
   - Trigger the quick fix by clicking the lightbulb icon or pressing `Ctrl+.` (Windows/Linux) or `Cmd+.` (macOS).

2. **Select Ignore Action:**
   - Choose the `Add # pyright: ignore[<errorCode>]` option from the quick fix suggestions.

## License

[MIT](LICENSE)
