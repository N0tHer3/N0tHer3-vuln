#!/bin/bash
# N0tHer3-vuln 内部靶场 - 一键启动脚本
# 使用方法: bash start.sh

echo "=========================================="
echo "   N0tHer3-vuln 内部靶场 - Docker启动"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[!] Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "[*] 启动靶场环境..."
echo ""

cd "$(dirname "$0")"

# Start services
docker-compose up -d --build

echo ""
echo "[*] 等待 MySQL 初始化..."
sleep 10

echo ""
echo "=========================================="
echo "   靶场环境已启动！"
echo "=========================================="
echo ""
echo "  [*] Web 站点:    http://114.66.38.126:8080/vuln/"
echo "  [*] 登录账号:    admin / admin@1234"
echo "  [*] 普通用户:    zhangwei / zhang123"
echo "  [*] phpMyAdmin:  http://114.66.38.126:8081/"
echo "  [*] MySQL:       localhost:3307 (root/root)"
echo ""
echo "  漏洞列表:"
echo "    1. Cookie提权:     修改 hx_role=1"
echo "    2. 水平越权:       修改UUID参数访问他人信息"
echo "    3. SQL注入:        公告搜索 keyword 参数"
echo "    4. 文件上传绕过:   .pphphp 双写绕过"
echo "    5. SSRF:           用户头像 imgproxy 接口"
echo "    6. 任意文件读取:   fileview?path= 参数"
echo ""
echo "  停止靶场: docker-compose down"
echo "=========================================="
