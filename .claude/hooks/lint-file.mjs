// PostToolUse (Edit|MultiEdit|Write): eslint on the changed src ts/tsx file. Full tsc stays a task-end step.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const file = String(input.tool_input?.file_path ?? '').replaceAll('\\', '/')
if (!/\/src\/.+\.tsx?$/.test(file)) process.exit(0)

const r = spawnSync('npx', ['eslint', file], { shell: true, encoding: 'utf8', timeout: 90000 })
if (r.status) {
  console.error(`eslint failed on ${file}:\n${r.stdout}${r.stderr}`)
  process.exit(2)
}
