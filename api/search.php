<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

// 人员搜索接口 - 返回所有匹配用户的uuid和基本信息
// 设计为通讯录功能，可搜索到其他用户的uuid（用于组合拳水平越权）
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$deptId = isset($_GET['dept_id']) ? intval($_GET['dept_id']) : 0;

$sql = "SELECT u.uuid, u.real_name, u.position, d.name as department_name, u.email, u.phone
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.status = 1";

$params = [];
$types = '';

if (!empty($keyword)) {
    $sql .= " AND (u.real_name LIKE ? OR u.position LIKE ? OR u.username LIKE ?)";
    $like = "%$keyword%";
    $params = [$like, $like, $like];
    $types = 'sss';
}

if ($deptId > 0) {
    $sql .= " AND u.department_id = ?";
    $params[] = $deptId;
    $types .= 'i';
}

$sql .= " ORDER BY d.sort_order ASC, u.id ASC";

if (!empty($params)) {
    $stmt = $db->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $db->query($sql);
}

$list = [];
while ($result && $row = $result->fetch_assoc()) {
    $list[] = $row;
}

// 同时返回部门列表供筛选
$depts = [];
$r = $db->query("SELECT id, name FROM departments WHERE status = 1 ORDER BY sort_order");
while ($r && $row = $r->fetch_assoc()) {
    $depts[] = $row;
}

jsonResponse(0, 'success', [
    'list' => $list,
    'departments' => $depts
]);
