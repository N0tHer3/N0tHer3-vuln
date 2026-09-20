<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 水平越权漏洞：通过uuid参数查看任意用户信息
    // 正常流程：前端传当前用户的uuid，但可替换为其他用户uuid查看敏感信息
    $uuid = isset($_GET['uuid']) ? trim($_GET['uuid']) : $user['uuid'];

    $stmt = $db->prepare("SELECT u.id, u.uuid, u.username, u.real_name, u.phone, u.email, u.position, u.entry_date, u.avatar, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.uuid = ? AND u.status = 1");
    $stmt->bind_param('s', $uuid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // 获取身份证号（自己的也返回，用于前端显示）
        $stmt2 = $db->prepare("SELECT id_card FROM users WHERE uuid = ? AND status = 1");
        $stmt2->bind_param('s', $uuid);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        if ($row2 = $result2->fetch_assoc()) {
            $row['id_card'] = $row2['id_card'];
        }
        jsonResponse(0, 'success', $row);
    } else {
        jsonResponse(404, '用户不存在');
    }
} elseif ($method === 'POST') {
    // 更新个人信息
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
    } else {
        $data = $_POST;
    }
    if (!$data) {
        jsonResponse(400, '参数错误');
    }

    $userId = intval($user['user_id']);
    $fields = [];
    $types = '';
    $values = [];

    $allowedFields = ['phone', 'email', 'avatar'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $types .= 's';
            $values[] = $data[$field];
        }
    }

    if (empty($fields)) {
        jsonResponse(400, '没有可更新的字段');
    }

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $types .= 'i';
    $values[] = $userId;

    $stmt = $db->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    jsonResponse(0, '更新成功');
}
