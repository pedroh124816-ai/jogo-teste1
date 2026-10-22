import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FONT_GLYPHS } from '../src/assets/fontGraphics';

function getAllFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions));
    } else {
      if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function extractStringsFromJson(obj: unknown, list: string[]): void {
  if (typeof obj === 'string') {
    list.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      extractStringsFromJson(item, list);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      extractStringsFromJson(val, list);
    }
  }
}

describe('Validação de Glifos da Fonte Bitmap', () => {
  it('os glifos de [ e ] devem ter desenho correto e distinto de letras (não podem ser C ou I)', () => {
    const leftBracket = FONT_GLYPHS['['];
    const rightBracket = FONT_GLYPHS[']'];

    expect(leftBracket, "Glifo de '[' não encontrado").toBeTruthy();
    expect(rightBracket, "Glifo de ']' não encontrado").toBeTruthy();

    expect(leftBracket.length).toBe(8);
    expect(rightBracket.length).toBe(8);

    // No colchete direito ']', a espinha vertical deve ficar à direita (ex: '....##..'), não no meio ('...##...')
    const spineRight = rightBracket.slice(1, 6).every((row) => row.endsWith('##..') || row.includes('....##..'));
    expect(spineRight, "A coluna vertical de ']' deve estar no lado direito").toBe(true);

    // No colchete esquerdo '[', a espinha vertical deve ficar à esquerda
    const spineLeft = leftBracket.slice(1, 6).every((row) => row.startsWith('.##.') || row.includes('.##.....'));
    expect(spineLeft, "A coluna vertical de '[' deve estar no lado esquerdo").toBe(true);
  });

  it('todos os caracteres em todas as strings do jogo devem possuir glifo na fonte', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const sourceFiles = getAllFiles(srcDir, ['.ts', '.json']);

    const stringRegex = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
    const missingGlyphs = new Map<string, Set<string>>();

    for (const filePath of sourceFiles) {
      if (filePath.endsWith('fontGraphics.ts')) continue;

      const fileStrings: string[] = [];

      if (filePath.endsWith('.json')) {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        extractStringsFromJson(json, fileStrings);
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        let match: RegExpExecArray | null;

        while ((match = stringRegex.exec(content)) !== null) {
          const raw = match[2];
          if (raw.startsWith('./') || raw.startsWith('../') || raw.includes('font-family') || raw.includes('data:')) {
            continue;
          }

          // Desescapa sequências comuns de escape
          const unescaped = raw
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          fileStrings.push(unescaped);
        }
      }

      for (const text of fileStrings) {
        for (const char of text) {
          if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
            continue;
          }

          if (!(char in FONT_GLYPHS)) {
            if (!missingGlyphs.has(char)) {
              missingGlyphs.set(char, new Set());
            }
            missingGlyphs.get(char)!.add(path.basename(filePath));
          }
        }
      }
    }

    if (missingGlyphs.size > 0) {
      const details = Array.from(missingGlyphs.entries())
        .map(([c, files]) => `'${c}' (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) nos arquivos: ${Array.from(files).join(', ')}`)
        .join('\n');
      expect.fail(`Foram encontrados caracteres em strings do jogo sem glifo em FONT_GLYPHS:\n${details}`);
    }
  });
});
