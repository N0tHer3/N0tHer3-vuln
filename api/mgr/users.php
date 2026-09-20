<?php
/**
 * 用户管理接口 - 需要管理员权限
 * Cookie提权漏洞：基于cookie中的hx_role判断权限
 * 漏洞利用：普通用户修改cookie hx_role=1即可提权访问
 */
require_once __DIR__ . '/../auth.php';

// Cookie提权漏洞：使用基于cookie的权限检查（可被篡改）
$user = checkAdminByCookie();

$db = getDB();

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$pageSize = 20;
$offset = ($page - 1) * $pageSize;

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$where = "u.status = 1";
if (!empty($keyword)) {
    $kw = $db->real_escape_string($keyword);
    $where .= " AND (u.real_name LIKE '%{$kw}%' OR u.username LIKE '%{$kw}%')";
}

// 查询总数
$r = $db->query("SELECT COUNT(*) as cnt FROM users u WHERE {$where}");
$total = $r ? intval($r->fetch_assoc()['cnt']) : 0;

// 查询用户列表 - 管理员可查看所有敏感字段（含身份证号）
$sql = "SELECT u.uuid, u.username, u.real_name, u.phone, u.id_card, d.name as department, u.position,
        CASE u.status WHEN 1 THEN '在职' WHEN 0 THEN '离职' ELSE '未知' END as status
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE {$where}
        ORDER BY u.id ASC
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