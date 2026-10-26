# Electron 版本与发布

Git 保存源码和版本标签，GitHub Actions 在对应标签上构建、测试、归档，GitHub Releases 保存各版本下载文件与更新说明。版本号以 `apps/desktop/package.json` 的 `version` 为准；Electron 打包时已将其写入应用元数据。

## 发布一个版本

1. 修改桌面 `version`，例如 `0.1.1`；修复递增补丁号，新功能递增次版本号，不兼容变更递增主版本号。测试版可使用 `0.2.0-beta.1`。
2. 提交版本号及本次源码变更，将包含新版工作流的提交合入 `main`。
3. 在该提交创建并推送对应标签：

   ```bash
   git tag -a desktop-v0.1.1 -m "FolioForge 0.1.1"
   git push origin desktop-v0.1.1
   ```

4. `Desktop compatibility` 自动校验标签与应用版本一致，在 Windows x64、macOS arm64 / Intel x64、Ubuntu x64 上运行检查、引擎测试、Web 测试、Electron GUI 测试、打包和打包产物启动测试。
5. 四个平台全部成功并上传产物后，创建带更新说明和 SHA-256 校验文件的 **Release 草稿**。在 GitHub Releases 中核对并发布；带 `-beta.1` 等后缀的版本自动标记为预发布。

`main` / PR / 普通手动运行仍执行兼容性测试，不生成 Release。不能覆盖已有 Release；任务失败后可重跑失败任务。如果创建 Release 时中断并留下不完整草稿，先核对并删除该草稿，再重跑发布 job。已发布标签不要移动或复用。代码有变化时递增版本号并创建新标签。工作流使用 GitHub 自带的 `GITHUB_TOKEN`，只有创建 Release 的 job 有 `contents: write`，无需新增个人令牌。

## 下载文件

| 系统 | 文件示例 |
| --- | --- |
| Windows x64 | `FolioForge-0.1.1-win32-x64.zip` |
| macOS Apple Silicon | `FolioForge-0.1.1-darwin-arm64.zip` |
| macOS Intel | `FolioForge-0.1.1-darwin-x64.zip` |
| Linux x64 | `FolioForge-0.1.1-linux-x64.tar.gz` |
| SHA-256 校验 | `SHA256SUMS.txt` |

解压后保留整个 `PixelForge-*` 目录。Windows 启动 `PixelForge.exe`，macOS 打开目录内的 `.app`，Linux 启动 `PixelForge`。Linux 如果需要配置沙箱辅助程序，在解压目录执行：

```bash
sudo chown root:root PixelForge-linux-x64/chrome-sandbox
sudo chmod 4755 PixelForge-linux-x64/chrome-sandbox
./PixelForge-linux-x64/PixelForge
```

Linux 归档保留可执行权限和符号链接，macOS 使用 `ditto` 保留应用包结构。发布资源临时存入 Actions Artifacts 7 天；Release 创建成功后，下载包留在 Release 中，独立于这 7 天的临时存储期限。

## 与自动更新的关系

这套流程实现版本管理与发布，当前下载包仍是未签名的便携包。macOS 系统可能阻止未签名、未公证的应用运行。安装向导、Windows/macOS 签名及公证、客户端自动检测与安装更新，仍按后续发布配套工作单独接入。旧版回退目前通过下载旧 Release 手动替换应用完成。

参考：[GitHub CLI 创建 Release](https://cli.github.com/manual/gh_release_create)、[Electron 更新机制](https://www.electronjs.org/docs/latest/tutorial/updates)。

## 配置验证记录

2026-10-25 本地验证：actionlint 1.7.12（含 ShellCheck）通过；全部 40 个 Vitest 通过，其中新增 3 个直接执行工作流版本校验代码的用例。隔离执行工作流的发布 shell，验证正式版、预发布标记以及缺少产物时拒绝发布；该检查使用 `gh` 命令替身。现有 Windows 打包产物实际归档后，73 个文件的名称、大小及 `app.asar` SHA-256 一致。本轮没有推送版本标签或创建真实 Release；新工作流的四平台归档及 GitHub 上传仍需首次标签运行验证。
