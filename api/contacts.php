<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

// 获取通讯录列表
$stmt = $db->prepare("SELECT u.real_name, u.phone, u.position, d.name as department FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.status = 1 ORDER BY d.name, u.real_name");
$stmt->execute();
$result = $stmt->get_result();

$contacts = [];
while ($row = $result->fetch_assoc()) {
    $contacts[] = $row;
}

jsonResponse(0, 'success', $contacts);
