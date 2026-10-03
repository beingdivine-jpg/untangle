/* global process, console */
import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
const catalog = JSON.parse(fs.readFileSync('src/i18n/pl.json', 'utf8'))
const missing = new Map()
function check(value, file) {
  const key = value.trim().replace(/\s+/g, ' ')
  if (!key || !/[A-Za-z]/.test(key) || catalog[key]) return
  missing.set(key, [...(missing.get(key) ?? []), file])
}
function strings(node, file) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) check(node.text, file)
  else if (ts.isConditionalExpression(node)) { strings(node.whenTrue, file); strings(node.whenFalse, file) }
}
function visitFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) { visitFiles(file); continue }
    if (!/\.tsx?$/.test(file)) continue
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
    const visit = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'translate' && node.arguments.length) strings(node.arguments[0], file)
      if (file.endsWith('/services.ts') && ts.isPropertyAssignment(node) && ['title','detail'].includes(node.name.getText(source))) strings(node.initializer, file)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}
visitFiles('src')
if (process.argv.includes('--json')) console.log(JSON.stringify([...missing.keys()], null, 2))
else if (missing.size) { for (const [key, files] of missing) console.error(`${key} (${[...new Set(files)].join(', ')})`); process.exitCode = 1 }
else console.log('All literal UI messages and service choices have Polish translations. Dynamic catalog content is checked by unit tests.')
