# @majinding/teampkg

npm 包演示项目:执行 `teampkg install` 进行交互式安装。

## 安装

```bash
npm install -g @majinding/teampkg   # 全局安装,获得 teampkg 命令

# 本地开发
npm install                         # 安装本地依赖(仅 devDependencies)
npm link                            # 将 teampkg 命令链接到全局 PATH
```

## 使用

```bash
teampkg help         # 查看帮助
teampkg install      # 交互式安装向导
```

`teampkg install` 会依次询问:

1. **安装模式** `standard` / `minimal`(默认 standard)
2. **是否安装全局资源**(默认 Y)
3. **是否生成示例文件**(默认 Y)

完成后在当前目录写入:

- `teampkg.config.json` — 安装摘要(模式、全局、示例、时间戳)
- `sample.md` — 仅在"生成示例文件"为 yes 时写入

## 发布到 npm

scoped 包名占用检查(以 `@majinding` 用户/组织名下的 `teampkg` 为例):

```bash
npm view @majinding/teampkg --registry https://registry.npmjs.org
```

发布步骤:

```bash
npm login
npm publish
```

> 说明:
> - `@majinding` 是 scope,需要先在 npm 注册同名的用户或组织(用户名需为 `majinding`)。
> - scoped 包发布为 public 时,需 `publishConfig.access: public`(本仓库已配置)。
> - 包名 `@majinding/teampkg` 若不可用,请改 `package.json` 的 `name` 字段,
>   同步修改 `bin` 键名(命令名,本例为 `teampkg`)与 `files` 目录引用。

## 目录结构

```
bin/teampkg.js       CLI 入口(shebang + 转发 src/cli.js)
src/cli.js           交互式 install 逻辑与 runCli 入口
src/index.js         包导出面(可被 require/import)
test/install.test.js node:test 单元测试
```

## 测试

```bash
npm test
```

详细调试、本地链接、发布前检查见 [`docs/debugging.md`](docs/debugging.md)。

## 发布到 GitHub 仓库

本项目源码托管在 GitHub(`github.com/majinding/npm-package-demo`),
发布 npm 包与同步 GitHub 仓库是两条独立的路径:

### 1. 源码推送到 GitHub

首次初始化:

```bash
git init
git add .
git commit -m "feat: @majinding/teampkg v0.1.0"
git remote add origin https://github.com/majinding/npm-package-demo.git
git push -u origin main
```

后续每次发版:

```bash
npm version patch    # 自动 bump 版本号 + 打 git tag v0.1.1 + 提交
git push origin main --tags
```

> `npm version` 会同时修改 `package.json`/`package-lock.json`、创建 git commit
> 和 tag,确保 git 历史与 npm 版本一一对应。

### 2. 发布 npm 包(可选:自动随 git tag 触发)

手动发布:

```bash
npm login
npm publish
```

如果用 GitHub Actions 自动发布(推荐),在 `.github/workflows/publish.yml`
添加:

```yaml
name: Publish to npm
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry: npm
      - run: npm ci
      - run: npm test
      # 使用 npm_token 直接认证(简单)
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

并在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中
添加 `NPM_TOKEN`(在 [npmjs.com → Access Tokens](https://www.npmjs.com/settings/tokens)
生成 Classic Token,勾选 `Read and write`)。

之后打 tag 即自动发版:

```bash
npm version patch   # 生成 v0.1.1
git push origin main --tags
```

### 3. 验证

```bash
npm view @majinding/teampkg --registry https://registry.npmjs.org
git tag -l          # 查看已打版本
```

> 注意:`npm version` 默认按 `patch` 递增(0.1.0 → 0.1.1),
> 也可以用 `npm version minor` / `npm version major`。

