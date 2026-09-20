<?php
/**
 * 系统配置接口 - 垂直越权漏洞
 * 漏洞：普通用户也可以访问此接口读取系统配置（包含数据库密码等敏感信息）
 * 正常应该只有管理员(role=0)可以访问
 */
require_once __DIR__ . '/../auth.php';

$user = checkAuth();
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 返回所有系统配置（包含数据库密码等敏感信息）
    // 漏洞：没有检查用户角色，普通用户也能读取
    $result = $db->query("SELECT config_key, config_value, description, updated_at FROM sys_config ORDER BY id ASC");
    $list = [];
    while ($result && $row = $result->fetch_assoc()) {
        $list[] = $row;
    }

    // 转换为key-value格式方便前端使用
    $config = [];
    foreach ($list as $item) {
        $config[$item['config_key']] = $item['config_value'];
    }

    jsonResponse(0, 'success', $config);

} elseif ($method === 'POST') {
    // POST操作需要管理员权限（role=1）
    if (intval($user['role']) !== 1) {
        jsonResponse(403, '无权限修改配置');
    }

    $data = [];
    parse_str(file_get_contents('php://input'), $data);

    if (empty($data)) {
        $data = $_POST;
    }

    foreach ($data as $key => $value) {
        $k = $db->real_escape_string($key);
        $v = $db->real_escape_string($value);
        $db->query("UPDATE sys_config SET config_value = '{$v}', updated_at = NOW() WHERE config_key = '{$k}'");
    }

    jsonResponse(0, '配置保存成功');
}