**定制商城 1.0.0version**
## 接入AI大模型进行详细定制

## 环境准备
    Node.js(推荐版本: v16.x 或更高)

## 项目基于MongoDB部署后端数据库
    可使用docker快捷部署，需根据自身数据库情况配置创建.env配置文件

## 前端密钥管理说明
    项目不会附带大模型秘钥，需要自己申请，并在项目中配置，前端密钥采用 ai.secret.js 文件管理，已提供 ai.secret.example.js 示例文件。
    示例：
    export const IMAGE_ACCESS_KEY = '你的绘图key';
    export const IMAGE_SECRET_KEY = '你的绘图secret';
    export const CHAT_API_KEY = '你的对话api_key';

## 确保安装好所有依赖
    `npm install`

## 项目启动方式
    进入`admin-system`目录：`npm run dev`
    进入`backend-api`目录：`node server.js`，需确保MongoDB服务正在运行。
    进入`client-system`目录：`npm run dev:h5`
    进入`client-system/server`目录：`node index.js`
