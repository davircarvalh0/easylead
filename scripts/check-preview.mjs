import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import assert from 'node:assert/strict';

// Build independently before comparing: a stale checked-in preview must fail.
const output = 'test-results/preview-verification';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--base', './', '--outDir', output], {stdio:'inherit'});
function files(root, current=root) {
  return readdirSync(current, {withFileTypes:true}).flatMap(entry => {
    const path=join(current, entry.name);
    return entry.isDirectory() ? files(root,path) : [relative(root,path)];
  }).sort();
}
const expected=files(output);
assert.deepEqual(files('previa'),expected,'Preview file inventory differs from current React build');
for(const path of expected) {
  assert.ok(readFileSync(resolve(output,path)).equals(readFileSync(resolve('previa',path))), `Stale preview: ${path}`);
}
console.log(`Preview matches current React build byte for byte (${expected.length} files).`);
