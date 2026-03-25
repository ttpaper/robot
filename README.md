# GLM Chatbot (Vercel + ZhipuAI)

一个简单的聊天机器人网页：

- 前端：Vercel 托管的 Next.js 页面
- 后端：`/api/chat` 服务器端转发到智谱 `open.bigmodel.cn` 的对话补全接口

## 需要你手动设置（Vercel 环境变量）

在 Vercel 项目设置中添加环境变量：

- `ZHIPU_API_KEY`：你的智谱开放平台 API Key

> 不要把 API Key 放到前端代码里（本项目已确保只在服务端读取）。

## 默认模型

前端默认使用：

- `glm-4-flash-250414`（页面下拉可切换）

如果智谱后续调整了“免费模型”的名称，你可以在页面顶部模型下拉里改成新的字符串。

## 本地运行（可选）

本地没有 Node.js 也可以直接部署到 Vercel。
如果你装了 Node，可以在该目录运行：

- `npm i`
- `npm run dev`

