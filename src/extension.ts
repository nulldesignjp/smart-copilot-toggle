import * as vscode from 'vscode';

const LANGUAGE_POLICY: Record<string, boolean> = {
  "html": true, // htmlはセクションごとに判定するので、ここは一旦true
  "css": false,
  "plaintext": false,
  "pug": false,
  "json": false,
  "javascript": true,
  "javascriptreact": true,
  "typescript": true,
  "typescriptreact": true,
  "vue": true,
  "markdown": true,
  "stylus": true,
  "python": true,
  "php": true
};

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('smartCopilotToggle.toggleCopilot', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const languageId = document.languageId;

    let shouldEnable = LANGUAGE_POLICY[languageId];
    if (shouldEnable === undefined) {
      shouldEnable = true;
    }``

    if (shouldEnable) {
      if (languageId === 'vue') {
        const vueSection = detectVueSectionByOffset(document, position);
        if (vueSection === 'template' || vueSection === 'style') {
          shouldEnable = false;
        } else if (vueSection === 'script' || vueSection === 'unknown') {
          shouldEnable = true;
        }
      }
      else if (languageId === 'html') {
        const htmlSection = detectHtmlSectionByOffset(document, position);
        if (htmlSection === 'head' || htmlSection === 'script') {
          shouldEnable = true;
        } else {
          shouldEnable = false;
        }
      }
    }

    try {
      await v`scode.workspace.getConfiguration('github.copilot').update(
        'inlineSuggest.enable',
        shouldEnable,
        vscode.ConfigurationTarget.Global
      );
    } catch (error) {
      // 本番版ではエラー出さない
    }

    vscode.window.showInformationMessage(
      `Copilot Inline Suggest ${shouldEnable ? '✅ Enabled' : '❌ Disabled'}`
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

// --- ヘルパー関数 (Vue用) ---

function detectVueSectionByOffset(document: vscode.TextDocument, position: vscode.Position): 'template' | 'script' | 'style' | 'unknown' {
  const text = document.getText().toLowerCase();
  const cursorOffset = document.offsetAt(position);

  const sections = [
    ...findTagRanges(text, 'template'),
    ...findTagRanges(text, 'script'),
    ...findTagRanges(text, 'style')
  ];

  for (const section of sections) {
    if (cursorOffset >= section.start && cursorOffset <= section.end) {
      return section.type as 'template' | 'script' | 'style';
    }
  }

  return 'unknown';
}

// --- ヘルパー関数 (HTML用) ---

function detectHtmlSectionByOffset(document: vscode.TextDocument, position: vscode.Position): 'head' | 'script' | 'unknown' {
  const text = document.getText().toLowerCase();
  const cursorOffset = document.offsetAt(position);

  const sections = [
    ...findTagRanges(text, 'head'),
    ...findTagRanges(text, 'script')
  ];

  for (const section of sections) {
    if (cursorOffset >= section.start && cursorOffset <= section.end) {
      return section.type as 'head' | 'script';
    }
  }

  return 'unknown';
}

// --- 汎用タグ検出関数 ---

function findTagRanges(text: string, tagName: string): { start: number; end: number; type: string }[] {
  const ranges: { start: number; end: number; type: string }[] = [];
  const openTagRegex = new RegExp(`<${tagName}(\\s[^>]*)?>`, 'gi');
  const closeTagRegex = new RegExp(`</${tagName}>`, 'gi');

  let match: RegExpExecArray | null;

  while ((match = openTagRegex.exec(text)) !== null) {
    const openTagEnd = openTagRegex.lastIndex;
    const closeMatch = closeTagRegex.exec(text);

    if (closeMatch) {
      const closeTagStart = closeMatch.index;
      ranges.push({
        start: openTagEnd,
        end: closeTagStart,
        type: tagName
      });
    } else {
      break;
    }
  }

  return ranges;
}
