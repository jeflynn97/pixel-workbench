# 像素工作台 Pixel Workbench

个人一站式全能工作台 PWA：全能记账 · 公私待办 · 店铺库存 · 生活记录 · 追剧清单 · 美食地图 · 随机点餐 · 食谱管理 · 生产任务看板。

像素可爱风格，米色 + 浅粉 + 浅灰配色，移动端优先，支持添加到手机主屏幕、离线基础访问。

## 数据存储说明（重要）

**当前版本数据保存在你手机/电脑浏览器本地（localStorage），不会自动同步到云端、不会跨设备共享。**

- 想在多台设备间迁移数据，或者升级到新版本/新链接后保留历史记录：使用右上角 **导出数据**（下载 JSON 备份文件）→ 到新环境后 **导入数据**（选择该 JSON 文件）即可一键还原全部模块数据。
- 建议定期导出备份，避免清理浏览器缓存导致数据丢失。
- 如果后续需要"多设备云同步"，可以在此基础上接入 Supabase / Firebase 等后端，我也可以帮你继续扩展。

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 http://localhost:5173），手机需与电脑同一局域网，用电脑打印的网络地址（如 http://192.168.x.x:5173）在手机浏览器访问。

## 打包构建

```bash
npm run build
npm run preview   # 本地预览生产构建
```

构建产物在 `dist/` 目录。

## 部署到公网（获得手机可访问的永久链接）

推荐 **Vercel** 或 **Netlify**，都支持免费额度、一键部署、自动 HTTPS：

### 方式一：Vercel（推荐，最简单）
1. 把本项目上传到 GitHub 仓库（或用 Vercel CLI 直接部署本地文件夹）。
2. 打开 https://vercel.com ，用 GitHub 登录，选择该仓库，Framework 选 **Vite**，其余保持默认，点击 Deploy。
3. 几十秒后即可获得形如 `https://your-project.vercel.app` 的公网链接，手机浏览器直接访问。
4. 之后每次修改代码并推送到 GitHub，Vercel 会自动重新部署。

或使用命令行（需要本机能联网）：
```bash
npm i -g vercel
vercel --prod
```

### 方式二：Netlify
1. 打开 https://app.netlify.com ，将本项目文件夹直接拖拽到部署区域，或连接 GitHub 仓库。
2. Build command 填 `npm run build`，Publish directory 填 `dist`。
3. 部署完成后同样会给一个公网 HTTPS 链接。

> 项目使用 hash 路由（链接形如 `#finance`），无需额外配置服务器重写规则，Vercel/Netlify 默认设置即可正常工作。

## 添加到手机主屏幕（PWA）

- **iPhone Safari**：打开部署好的链接 → 点击底部「分享」图标 → 「添加到主屏幕」。
- **Android Chrome**：打开链接 → 右上角菜单 → 「添加到主屏幕」/ 「安装应用」。

添加后会以独立图标打开，无浏览器地址栏，基础页面支持离线访问（地图瓦片、地址查询等联网功能仍需网络）。

## 目录结构

```
src/
  lib/            数据存储、计算、工具函数（storage.js 是全局导入导出的核心）
  components/     通用像素风 UI 组件（Card / Button / Modal / Input 等）
  modules/        九大功能模块，每个模块一个文件夹
  pages/Home.jsx  首页模块入口网格 + 财务速览
  App.jsx         模块间导航（hash 路由）
public/icons/     PWA 图标（像素风生成）
```

## 后续可迭代方向

- 接入 Supabase/Firebase 实现多设备云同步 + 账号登录
- 美食地图接入更完善的地图 SDK（当前用 Leaflet + OpenStreetMap，免费无需 API Key）
- 各模块细节打磨：图表可视化、批量操作、更丰富的筛选排序等

如需继续迭代，把本项目交给 Claude Code 持续开发即可（终端运行 `claude` 进入项目目录后直接对话提需求）。
