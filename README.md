<div align="center">

# N0tHer3-vuln · 内部安全靶场

**模拟企业 OA 协同办公 · 综合性 Web 安全演练环境**

[作者博客](https://n0ther3.github.io/) · [GitHub 主页](https://github.com/N0tHer3)

![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![PHP](https://img.shields.io/badge/PHP-7.3-blue?style=flat-square&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange?style=flat-square&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

</div>

---

N0tHer3-vuln 是一个自建的**综合性 Web 安全演练靶场**：以前端可交互的「企业 OA 协同办公系统」为载体，还原真实企业内部业务场景（登录认证、通讯录、新闻公告、项目协作、文件中心、个人中心等），并在其中埋入多类常见的 Web 安全漏洞场景，供安全学习与授权演练使用。

靶场配套 [N0tHer3 个人博客](https://n0ther3.github.io/)的漏洞复现系列文章，也可独立部署用于自学、教学与工具链调试。

## ✨ 这个靶场是做什么的

- **伪真实业务系统**：完整还原 OA 业务流——用户登录、角色权限、通讯录、新闻公告、项目管理、文件查看下载、头像上传；原生 HTML/CSS/JS 实现，贴近真实交付系统的质感
- **多类漏洞场景**：内置信息泄露、SSRF、越权访问、任意文件读取、SQL 注入、文件上传等常见 Web 漏洞场景，难度由浅入深；不提供任何攻略与答案，鼓励自主探索
- **黑盒 + 白盒对照**：黑盒打通后可直接阅读 `api/` 下的 PHP 源码，对照漏洞成因，理解「为什么能打」
- **开箱即用**：一条命令 Docker 启动，自动建库导数据，无需手工配置

## 🎯 有什么用

- Web 安全初学者的本地练习场：从信息收集、漏洞发现到利用验证的完整流程
- 授权渗透测试 / 红队演练前的手法热身与工具链调试
- 安全教学与培训演示：配合博客复现文章，边讲边练
- 漏洞原理研究：结合源码做白盒分析，理解常见漏洞的代码级成因

## 🚀 快速开始

```bash
# 方式一：一键脚本
bash start.sh

# 方式二：手动启动
docker-compose up -d --build
```

启动完成后访问：<http://localhost:8080/vuln/>

> 不用 Docker 也可以：本地 Apache + PHP 7.3 + MySQL 5.7（如 phpstudy），导入 `sql/init.sql`，把项目放进 Web 根目录即可。

## 📍 默认账号

| 项目 | 值 |
|------|-----|
| OA 系统地址 | http://localhost:8080/vuln/ |
| 管理员账号 | admin / admin@1234 |
| MySQL（Docker） | root / root（宿主机端口 3307） |

## 🗂 目录结构

```
├── api/                  # PHP 后端接口（业务逻辑与漏洞点源码）
├── css/                  # 前端样式
├── js/                   # 前端逻辑
├── sql/                  # 数据库初始化脚本
├── docker/               # Docker 构建：Apache 配置、MySQL 初始化
├── uploads/              # 上传目录与站内附件文档（运行时产物不入库）
├── index.html            # 登录页入口
├── docker-compose.yml    # 一键编排
└── start.sh              # 一键启动脚本
```

## 📄 License 与免责声明

- **开源协议**：本项目基于 [MIT License](LICENSE) 开源，欢迎学习、自用与二次部署（保留版权声明即可）
- **版权**：本项目及全部配套内容版权归 **N0tHer3** 所有，转载请注明出处与项目地址
- **免责声明**：本靶场**仅供安全学习、教学演示与授权测试使用**，所有漏洞场景均应在**本地隔离环境**中复现。严禁将本项目或由此掌握的技术用于任何**未授权**的系统测试、数据窃取或破坏行为——此类行为涉嫌违法犯罪（《中华人民共和国网络安全法》《刑法》第 285、286 条等），由此产生的一切后果由使用者自行承担，与作者本人无关。下载或使用本项目即视为已阅读并同意本声明。
