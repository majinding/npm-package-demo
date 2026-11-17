# teampkg 本地调试指南

本文档描述 `@majinding/teampkg` 在开发阶段的本地调试、安装验证与发布前检查流程。

---

## 1. 环境要求

- Node.js ≥ 18(推荐 20/22/24 LTS)
- npm ≥ 9
- Git(可选,用于版本管理)

验证:

```bash
node -v
npm -v
```

---

## 2. 本地链接开发(推荐日常方式)

不发布到 registry,直接让 `teampkg` 命令指向本地源码:

```bash
# 在项目根目录
cd D:\works\github\npm-package-demo

# 首次链接(之后代码改动即时生效,无需重复)
npm link

# 验证
teampkg help
teampkg install
where teampkg          # Windows:确认链接路径
which teampkg          # Linux/macOS
```

> `npm link` 会在全局创建符号链接 `teampkg` → 本项目 `bin/teampkg.js`,
> 直接运行源码,无需构建步骤。

取消链接:

```bash
npm unlink -g teampkg   # 或 npm unlink -g && npm link 重建
```

---

## 3. 直接运行 bin 入口(不链接,最轻量)

不想污染全局环境时:

```bash
node bin/teampkg.js help
node bin/teampkg.js install
```

等价于链接后的 `teampkg` 命令。

---

## 4. 从 git 仓库安装(模拟"未发布"时的远端用户视角)

先在 GitHub 推送:

```bash
git remote add origin https://github.com/majinding/npm-package-demo.git
git push -u origin main
```

然后在本机或其他机器:

```bash
npm install -g git+https://github.com/majinding/npm-package-demo.git
# 或简写
npm install -g github:majinding/npm-package-demo

# 验证
teampkg install
```

> 每次 `git push` 后需重新 `npm install -g git+...` 才会拉到新代码,
> 不如 `npm link` 即时。

---

## 5. 运行测试

```bash
npm test
# 等价于
node --test test/install.test.js
```

预期输出:

```
✔ install writes config in minimal mode without sample
✔ install writes sample file when requested
ℹ tests 2, pass 2, fail 0
```

---

## 6. 交互式安装手动验证

在**目标目录**(你希望生成配置文件的目录)执行:

```bash
teampkg install
```

依次回答三个问题:

| 问题 | 可选值 | 默认 |
|------|--------|------|
| 安装模式 | `standard` / `minimal` | standard(直接回车) |
| 是否安装全局资源 | `Y` / `n` | Y |
| 是否生成示例文件 | `Y` / `n` | Y |

完成后当前目录应出现:

- `teampkg.config.json` — 总是生成
- `sample.md` — 仅当第 3 题答 `y`

查看生成的 JSON 摘要(stdout 管道友好):

```bash
teampkg install > install.log    # JSON 摘要进 stdout
cat install.log                   # 查看 { mode, global, sample, target, written }
```

> banner 与提问走 stderr,JSON 摘要走 stdout,可用管道/重定向分离。

---

## 7. 发布前检查清单

```bash
# 1. 测试通过
npm test

# 2. 打包预览(不真正发布,看哪些文件会被打进 tarball)
npm pack --dry-run

# 3. 检查包名/命令名
node -e "const p=require('./package.json');console.log(p.name, p.bin)"
# 预期: @majinding/teampkg { teampkg: './bin/teampkg.js' }

# 4. 查 npm 上包名是否可注册
npm view @majinding/teampkg --registry https://registry.npmjs.org
# 404/ENEEDAUTH 表示未占用;若返回已有版本说明已被注册

# 5. 干跑 publish
npm publish --dry-run --registry https://registry.npmjs.org
```

全部通过后再执行:

```bash
npm login
npm publish
```

---

## 8. 常见问题

**Q: 改了 `src/cli.js` 但 `teampkg` 行为没变?**
A: 确认是用 `npm link` 链接的(非从 registry 装的全局版);
   `where teampkg` 看路径是否指向 `D:\works\github\npm-package-demo\bin`。

**Q: `npm link` 报 EACCES / 权限错误(Windows)?**
A: 以管理员身份运行终端,或检查全局目录
   `npm config get prefix` 下是否可写。

**Q: 测试偶发失败(stdin 写入过早)?**
A: 测试已内置 250ms/80ms 延时;若仍失败,
   检查是否用了 `node --test test/`(会当目录加载),
   必须写完整文件路径 `node --test test/install.test.js`。

**Q: 如何回滚已发布的版本?**
A: `npm deprecate @majinding/teampkg@0.1.0 "deprecated"` 标记弃用,
   或 `npm unpublish @majinding/teampkg@0.1.0`(24h 内且无下游依赖)。

---

## 速查表

| 场景 | 命令 |
|------|------|
| 日常开发 | `npm link` 后 `teampkg install` |
| 不链接跑一次 | `node bin/teampkg.js install` |
| 模拟远端用户 | `npm install -g github:majinding/npm-package-demo` |
| 跑测试 | `npm test` |
| 发布前干跑 | `npm pack --dry-run && npm publish --dry-run` |
| 正式发布 | `npm login && npm publish` |
