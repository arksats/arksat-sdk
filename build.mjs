import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
const root = dirname(fileURLToPath(import.meta.url))
const program = ts.createProgram(['index.ts', 'arksatSdkAdapter.ts', 'mock.ts', 'conformance.ts'].map(name => resolve(root, 'src', name)), {
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
  strict: true, skipLibCheck: true, declaration: true, rootDir: resolve(root, 'src'),
  outDir: resolve(root, 'dist'), types: [], lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
})
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: x => x, getNewLine: () => '\n' }))
if (program.emit().emitSkipped) throw new Error('SDK emit failed')
console.log('Built standalone @arksat/wallet-sdk')
