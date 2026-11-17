import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';

const CONFIG_NAME = 'teampkg.config.json';
const SAMPLE_NAME = 'sample.md';

const BANNER = `
teampkg install
---------------
交互式安装向导:依次询问安装模式、全局资源、示例文件,
然后在目标目录写入 teampkg.config.json 并打印安装摘要。
`;

function writeFiles(targetDir, summary) {
  fs.mkdirSync(targetDir, { recursive: true });
  const configPath = path.join(targetDir, CONFIG_NAME);
  fs.writeFileSync(configPath, `${JSON.stringify({ installedBy: 'teampkg', version: 1, ...summary, installedAt: new Date().toISOString() }, null, 2)}\n`);
  const written = [configPath];
  if (summary.sample) {
    const samplePath = path.join(targetDir, SAMPLE_NAME);
    fs.writeFileSync(samplePath, `# teampkg 示例文件\n\n这是 teampkg install 生成的示例文件(mode=${summary.mode},global=${summary.global})。\n`);
    written.push(samplePath);
  }
  return written;
}

function ask(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix} `, (answer) => {
      if (answer && answer.trim()) resolve(answer.trim());
      else resolve(defaultValue);
    });
  });
}

function askYesNo(rl, question, defaultYes = true) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise((resolve) => {
    rl.question(`${question} ${hint} `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (!a) resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

/**
 * 交互式安装流程。
 * @param {string} targetDir 安装资源写入的目录
 * @returns {Promise<{mode:string,global:boolean,sample:boolean,target:string,written:string[]}>}
 */
export async function install(targetDir = process.cwd()) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  process.stderr.write(BANNER);

  const mode = await ask(rl, '安装模式 [standard|minimal] (standard):', 'standard');
  const useGlobal = await askYesNo(rl, '是否安装全局资源?', true);
  const sample = await askYesNo(rl, '是否生成示例文件?', true);
  rl.close();

  const normalizedMode = mode === 'minimal' ? 'minimal' : 'standard';
  const summary = { mode: normalizedMode, global: useGlobal, sample, target: targetDir };
  summary.written = writeFiles(targetDir, summary);
  return summary;
}

/**
 * CLI 入口:支持 `teampkg install` 子命令。
 * @param {string[]} argv 已去掉 node 与脚本路径的 argv
 */
export function runCli(argv) {
  const command = argv[0];
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stderr.write('用法: teampkg <command>\n\n命令:\n  install  交互式安装向导(在当前目录生成配置与示例)\n  help     显示帮助\n');
    return;
  }
  if (command === 'install') {
    install().then((summary) => {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      process.stderr.write('\n安装完成 ✔\n');
    });
    return;
  }
  console.error(`未知命令: ${command}\n运行 teampkg help 查看可用命令。`);
  process.exitCode = 1;
}
