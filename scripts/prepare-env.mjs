/**
 * 构建前准备环境变量文件（跨平台，兼容 Vercel / Netlify 云端构建）
 * - 若已存在 .env 则不覆盖（云端可通过平台环境变量注入）
 * - 否则复制 .env.example 作为默认值
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const envFile = path.join(root, ".env");
const exampleFile = path.join(root, ".env.example");

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, envFile);
    console.log("[prepare-env] .env 不存在，已从 .env.example 复制默认配置");
  } else {
    console.warn("[prepare-env] 未找到 .env 与 .env.example，构建将使用默认占位符");
  }
} else {
  console.log("[prepare-env] 已存在 .env，跳过复制");
}
