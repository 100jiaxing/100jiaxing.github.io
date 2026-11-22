# 一灯的博客（Hexo 源码 + 静态站点）

本仓库同时存放 **Hexo 源码** 和 **已生成的静态站点**，并借助 GitHub Actions 把 `public/` 发布到 GitHub Pages。

- 线上地址：https://100jiaxing.github.io/
- Pages 部署方式：GitHub Actions（见 `.github/workflows/pages.yml`）
- 静态站点目录：`public/`
- Hexo 源码：仓库根目录（`source/`、`themes/`、`scaffolds/`、`_config.yml` 等）

## 目录结构

```text
.
├── .github/workflows/pages.yml   # 将 public/ 发布到 GitHub Pages
├── public/                       # 当前线上静态站点内容
├── source/                       # Hexo 文章与页面源码
├── themes/tomotoes/              # 主题（已作为普通文件纳入本仓库）
├── scripts/                      # Hexo 脚本，含自定义安全部署器
├── _config.yml                   # Hexo 配置（含部署配置）
└── package.json
```

## 日常发布

在本目录执行：

```bash
hexo g -d
```

`hexo g` 生成静态文件到 `public/`；`hexo d` 会执行自定义部署器（`scripts/deploy-git.js`），它会：

1. 从 `origin/master` 拉取最新的 `public/`；
2. 把远端 `public/` 合并进本地 `public/`（保留双方内容，不删除远端已有文件）；
3. 提交合并结果；
4. `git pull --rebase --autostash` 后再 `git push`（**不使用 --force**）；
5. 推送后由 GitHub Actions 自动发布 `public/` 到 Pages。

> 注意：请不要再用旧方式直接强推静态文件；也不要整目录复制覆盖。

## 主题说明

`themes/tomotoes/` 原来的独立 `.git` 已备份到仓库根目录的 `.git-tomotoes-backup/`（已在 `.gitignore` 中忽略）。主题文件现在作为普通文件由本仓库统一管理，因此主题配置、图片和 JS 修改都会随源码一起同步到其他电脑。

## 首次在新电脑上使用

```bash
git clone https://github.com/100jiaxing/100jiaxing.github.io.git
cd 100jiaxing.github.io
npm install
hexo g -d
```

首次推送需要完成 GitHub 认证（Git Credential Manager 或 SSH key）。

## GitHub Pages 设置

仓库 `Settings -> Pages -> Source` 需要选择 **GitHub Actions**。选择后，每次推送到 `master` 且 `public/` 有变化，都会自动更新线上站点。
