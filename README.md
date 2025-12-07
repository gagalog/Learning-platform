## Online Learning Platform

现代化的在线学习平台，集成公开课程浏览、搜索、视频/文章详情页以及管理员后台（内容、用户、评论管理等）。前端基于 React 19 + Ant Design，后端使用 Node.js (Express) + MongoDB，支持响应式 UI 与渐进增强。

### ✨ 主要特性
- **内容聚合**：文章与视频统一推荐，按点击量 + 时间排序，可按类型筛选、全文搜索。
- **富文本/视频管理**：后台提供 Markdown/富文本编辑、视频上传（外链）、标签与关键词管理。
- **权限体系**：AuthContext 管理登录状态、管理员权限，受保护的 Dashboard/Admin 区域只对授权用户开放。
- **性能优化**：
  - 路由级 `React.lazy + Suspense` 拆分，首屏 bundle 从 ~344 kB 降至 ~170 kB。
  - 缩略图统一走响应式代理（`images.weserv.nl`），默认输出 WebP，减少网络占用。
  - 服务器开启 `compression` gzip，并为首页内容 `/api/home` 增加 60 秒内存缓存 + `Cache-Control`。

### 🧰 技术栈
- **前端**：React 19、React Router 7、Ant Design 5、React Player、Axios。
- **后端**：Express 5、Mongoose 9、JSON Web Token、Multer、waifu-pics-api（壁纸兜底）。
- **工具**：npm、nodemon、json-server（本地 mock）。

### ⚙️ 环境准备
1. Node.js 18+ 与 npm。
2. MongoDB 实例（本地或云端）。
3. 在 `server/.env` 中配置：
	```env
	MONGO_URI=mongodb://localhost:27017/online-learning-platform
	JWT_SECRET=your-secret
	PORT=5001
	```

### 🚀 启动步骤
1. **安装依赖**
	```powershell
	cd d:\Desktop\online-learning-platform
	npm install
	cd server
	npm install
	```
2. **运行后台 API（需 Mongo 已启动）**
	```powershell
	cd d:\Desktop\online-learning-platform\server
	npm run dev
	```
3. **运行前端客户端**
	```powershell
	cd d:\Desktop\online-learning-platform
	npm start
	```

### 📦 常用脚本
| 位置 | 命令 | 说明 |
| --- | --- | --- |
| 根目录 | `npm start` | 运行 React 开发服务器（端口 3000，若占用会自动递增）。 |
| 根目录 | `npm run build` | 生成生产构建，输出到 `build/`。 |
| server | `npm run dev` | 使用 nodemon 监听的 Express API。 |
| server | `npm run seed:articles` / `npm run seed:videos` | 预置示例数据。 |

### 📈 性能与监控建议
- 构建完成后可通过 `npx serve build` 或部署到任何静态托管/CDN。
- 生产环境建议加上：
  - 反向代理层 (Nginx) 缓存 `/api/home`、静态资源，并开启 HTTP/2。
  - Web Vitals 或 APM（如 Sentry、New Relic）以持续跟踪 Core Web Vitals。
- 如需进一步提速，可考虑 SSR/预渲染热门页面与 Redis 缓存搜索结果。

### 🧪 测试与质量
- 前端可使用 `npm test`（React Testing Library）补充回归测试。
- 后端目前以手动/集成测试为主；可结合 `supertest` + Jest 编写 API 测试以长期保障质量。

### 🤝 贡献
欢迎提交 Issue / PR。建议在 PR 内注明：
- 修改背景 & 解决的问题。
- UI 截图或性能对比（如是可视化/性能改动）。

---
如遇到无法启动、构建报错或性能问题，可在 README 中新增对应 FAQ 条目，或直接反馈给维护者。祝使用愉快！
