import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const SRC_CLI = new URL('../src/cli.js', import.meta.url).href;

async function runInstallWithAnswers(targetDir, lines) {
  const script = `
import { install } from ${JSON.stringify(SRC_CLI)};
install(${JSON.stringify(targetDir)}).then((s) => console.log(JSON.stringify(s)));
`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
    cwd: targetDir,
    env: process.env,
  });
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (err += d));
  child.stdin.on('drain', () => {});
  await new Promise((r) => setTimeout(r, 250));
  for (const line of lines) {
    await new Promise((r) => setTimeout(r, 80));
    child.stdin.write(line);
  }
  child.stdin.end();
  const code = await new Promise((r) => child.on('close', r));
  if (code !== 0) throw new Error(`spawn exited ${code}\nstdout:${out}\nstderr:${err}`);
  const jsonStart = out.lastIndexOf('{');
  if (jsonStart < 0) throw new Error(`no JSON summary in stdout:\n${out}`);
  return JSON.parse(out.slice(jsonStart));
}

test('install writes config in minimal mode without sample', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teampkg-test-'));
  try {
    const summary = await runInstallWithAnswers(dir, ['minimal\n', 'n\n', 'n\n']);
    assert.equal(summary.mode, 'minimal');
    assert.equal(summary.global, false);
    assert.equal(summary.sample, false);
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'teampkg.config.json'), 'utf8'));
    assert.equal(config.mode, 'minimal');
    assert.equal(config.sample, false);
    assert.ok(!fs.existsSync(path.join(dir, 'sample.md')));
    for (const f of summary.written) assert.ok(fs.existsSync(f));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('install writes sample file when requested', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teampkg-test-'));
  try {
    const summary = await runInstallWithAnswers(dir, ['\n', 'y\n', 'y\n']);
    assert.equal(summary.mode, 'standard');
    assert.equal(summary.global, true);
    assert.equal(summary.sample, true);
    assert.ok(fs.existsSync(path.join(dir, 'teampkg.config.json')));
    assert.ok(fs.existsSync(path.join(dir, 'sample.md')));
    for (const f of summary.written) assert.ok(fs.existsSync(f));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
