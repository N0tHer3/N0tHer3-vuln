<?php
/**
 * 日志列表接口 - 需要管理员权限
 * Cookie提权漏洞：基于cookie中的hx_role判断权限
 * 漏洞利用：普通用户修改cookie hx_role=0即可提权访问
 */
require_once __DIR__ . '/../auth.php';

// Cookie提权漏洞：使用基于cookie的权限检查（可被篡改）
$user = checkAdminByCookie();

$db = getDB();

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$pageSize = 20;
$offset = ($page - 1) * $pageSize;

$module = isset($_GET['module']) ? trim($_GET['module']) : '';
$where = "1=1";
if (!empty($module)) {
    $m = $db->real_escape_string($module);
    $where .= " AND module = '{$m}'";
}

$r = $db->query("SELECT COUNT(*) as cnt FROM sys_logs WHERE {$where}");
$total = $r ? intval($r->fetch_assoc()['cnt']) : 0;

$sql = "SELECT id, username, action, module, ip_address as ip, detail, created_at
        FROM sys_logs
        WHERE {$where}
        ORDER BY created_at DESC
        LIMIT {$pageSize} OFFSET {$offset}";
$result = $db->query($sql);

$list = [];
while ($result && $row = $result->fetch_assoc()) {
    $list[] = $row;
}

jsonResponse(0, 'success', [
    'list' => $list,
    'total' => $total,
    'page' => $page
]);