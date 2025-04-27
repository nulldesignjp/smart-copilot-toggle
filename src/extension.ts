import * as vscode from 'vscode';

// 対象言語リストを外出し
const TARGET_LANGUAGES = [
  'html',
  'css',
  'javascript',
  'vue',
  'javascriptreact', // JSX (React)
  'typescriptreact', // TSX (React+TS)
  'typescript',
  'pug',
  'stylus'
];

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "smart-copilot-toggle" is now active!');

  let disposable = vscode.commands.registerCommand('smartCopilotToggle.toggleCopilot', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const languageId = editor.document.languageId;
    console.log('Current Language ID:', languageId);

    const shouldEnableCopilot = TARGET_LANGUAGES.includes(languageId);

    await vscode.workspace.getConfiguration('github.copilot').update(
      'inlineSuggest.enable',
      shouldEnableCopilot,
      vscode.ConfigurationTarget.Global
    );

    vscode.window.showInformationMessage(
      `Copilot Inline Suggest ${shouldEnableCopilot ? '✅ Enabled' : '❌ Disabled'}`
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
