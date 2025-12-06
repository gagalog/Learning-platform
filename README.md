# Online Learning Platform

## 开发与运行
```bash
npm install
npm start
```
默认会在 `http://localhost:3000` 启动前端。若使用 `json-server` 提供数据，请在另一个终端运行：
```bash
npx json-server --watch db.json --port 3001
```

## 管理员账号
- **邮箱**：`admin@test.com`
- **密码**：`admin123`

登录后台后可以上传/编辑视频、文章以及管理评论和用户。

## 视频发布与播放
- 视频表单支持 YouTube、Vimeo、Bilibili、Dailymotion 等常见平台链接。
- 链接验证通过后会展示实时预览；Bilibili 链接会自动转换为可播放的内嵌地址。
- 用户端的「视频详情」页使用 `react-player` 或 iframe 自动播放，无法内嵌的链接提供“新窗口打开”按钮。
- 在首页、搜索和后台列表中会显示视频缩略图、标签、浏览量等关键信息，保障发布后即可被发现与观看。

## 测试
项目暂无单元测试，可使用以下命令占位运行：
```bash
npm run test -- --watchAll=false --passWithNoTests
```
