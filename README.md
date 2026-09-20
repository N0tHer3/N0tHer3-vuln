# N0tHer3-vuln 内部靶场（OA 文件上传漏洞靶场）

## 一键启动

```bash
bash start.sh
```

或手动启动：
```bash
docker-compose up -d --build
```

## 访问地址

| 服务 | 地址 | 账号密码 |
|------|------|----------|
| OA 系统 | http://localhost:8080/vuln/ | admin / admin@1234 |
| 数据库管理 | http://localhost:8081/ | root / root |
| MySQL | localhost:3306 | root / root |

## 漏洞说明

### 文件上传 + 双写绕过

1. 登录后进入个人中心上传头像
2. 上传文件命名为: `shell.php.pphp`
3. 后台处理流程:
   - 黑名单检查: `pathinfo("shell.php.pphp", PATHINFO_EXTENSION)` → `pphphp` → 不在黑名单 → 通过
   - 过滤处理: `str_replace("php", "", "shell.php.pphp", 1)` → `shell.pphp`
   - 保存为: `[md5].php`
4. 访问: `http://目标/vuln/uploads/avatars/[md5].php`

### 蚁剑连接

```
URL: http://localhost:8080/vuln/uploads/avatars/[上传后的md5文件名].php
密码: 空 (或自定义)
```

### 其他漏洞

- **Cookie 提权**: 登录后修改 Cookie `hx_role=1` 可提权为管理员
- **任意文件读取**: `fileview.php?path=../../../etc/passwd`
- **SQL 注入**: 搜索接口存在注入

## 技术栈

- Apache 2.4 + PHP 7.3 (mod_php)
- MySQL 5.7
- 前端: 原生 HTML/CSS/JS

## 注意事项

- 此靶场仅用于安全测试和学习目的
- 请勿在生产环境中使用
