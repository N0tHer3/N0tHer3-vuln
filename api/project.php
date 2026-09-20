<?php
require_once __DIR__ . '/auth.php';
$user = checkAuth();
$db = getDB();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        // 获取项目列表
        // 管理员(role=1)可以看到所有项目，普通用户(role=0)只能看到自己的项目
        $cookieRole = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : intval($user['role']);

        if ($cookieRole == 1) {
            // 管理员：查看所有项目
            $sql = "SELECT p.id, p.uuid, p.name, p.description, p.status, p.approval_status, p.budget, p.start_date, p.end_date, p.progress, p.created_at, u.real_name as creator_name, d.name as department_name FROM projects p LEFT JOIN users u ON p.creator_id = u.id LEFT JOIN departments d ON p.department_id = d.id ORDER BY p.created_at DESC";
            $result = $db->query($sql);
        } else {
            // 普通用户：只查看自己的项目
            $userId = intval($user['user_id']);
            $stmt = $db->prepare("SELECT p.id, p.uuid, p.name, p.description, p.status, p.approval_status, p.budget, p.start_date, p.end_date, p.progress, p.created_at, u.real_name as creator_name, d.name as department_name FROM projects p LEFT JOIN users u ON p.creator_id = u.id LEFT JOIN departments d ON p.department_id = d.id WHERE p.creator_id = ? ORDER BY p.created_at DESC");
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $result = $stmt->get_result();
        }

        $projects = [];
        while ($row = $result->fetch_assoc()) {
            $projects[] = $row;
        }
        jsonResponse(0, 'success', $projects);
        break;

    case 'detail':
        // 水平越权漏洞：只检查项目id是否存在，不检查是否属于当前用户
        // 攻击者可以通过替换id查看其他人申报的项目详情
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            jsonResponse(1, '缺少项目ID');
        }
        $stmt = $db->prepare("SELECT p.id, p.uuid, p.name, p.description, p.status, p.approval_status, p.approval_remark, p.budget, p.start_date, p.end_date, p.progress, p.created_at, u.real_name as creator_name, u.phone as creator_phone, d.name as department_name, m.real_name as manager_name FROM projects p LEFT JOIN users u ON p.creator_id = u.id LEFT JOIN departments d ON p.department_id = d.id LEFT JOIN users m ON p.manager_id = m.id WHERE p.id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            jsonResponse(0, 'success', $row);
        } else {
            jsonResponse(1, '项目不存在');
        }
        break;

    case 'create':
        // 创建项目申报
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(1, '请求方法错误');
        }
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $departmentId = isset($_POST['department_id']) ? intval($_POST['department_id']) : 0;
        $budget = isset($_POST['budget']) ? floatval($_POST['budget']) : 0;
        $startDate = isset($_POST['start_date']) ? trim($_POST['start_date']) : '';
        $endDate = isset($_POST['end_date']) ? trim($_POST['end_date']) : '';

        if (empty($name)) {
            jsonResponse(1, '项目名称不能为空');
        }

        // 生成UUID
        $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $creatorId = intval($user['user_id']);
        $approvalStatus = '待审批';
        $projectStatus = '待启动';
        $stmt = $db->prepare("INSERT INTO projects (uuid, name, description, creator_id, manager_id, department_id, status, approval_status, budget, start_date, end_date, progress, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, NOW())");
        $stmt->bind_param('sssiisssss', $uuid, $name, $description, $creatorId, $departmentId, $projectStatus, $approvalStatus, $budget, $startDate, $endDate);
        if ($stmt->execute()) {
            jsonResponse(0, '项目申报提交成功', ['uuid' => $uuid, 'id' => $stmt->insert_id]);
        } else {
            jsonResponse(1, '提交失败，请稍后重试');
        }
        break;

    case 'approve':
        // Cookie提权漏洞：基于cookie中的hx_role判断权限
        // 漏洞利用：普通用户修改cookie hx_role=1即可提权审批项目
        $cookieRole = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : intval($user['role']);
        if ($cookieRole != 1) {
            jsonResponse(403, '无权限审批项目');
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(1, '请求方法错误');
        }
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $approvalStatus = isset($_POST['approval_status']) ? trim($_POST['approval_status']) : '';
        $remark = isset($_POST['remark']) ? trim($_POST['remark']) : '';
        $approverId = intval($user['user_id']);

        if ($id <= 0 || !in_array($approvalStatus, ['已通过', '已驳回'])) {
            jsonResponse(1, '参数错误');
        }

        $stmt = $db->prepare("UPDATE projects SET approval_status = ?, approval_remark = ?, approver_id = ? WHERE id = ?");
        $stmt->bind_param('ssii', $approvalStatus, $remark, $approverId, $id);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            // 如果审批通过，更新项目状态
            if ($approvalStatus === '已通过') {
                $db->query("UPDATE projects SET status = '进行中' WHERE id = $id AND status = '待启动'");
            }
            jsonResponse(0, '审批操作成功');
        } else {
            jsonResponse(1, '审批操作失败');
        }
        break;

    case 'all':
        // Cookie提权漏洞：基于cookie中的hx_role判断权限
        // 漏洞利用：普通用户修改cookie hx_role=1即可提权查看所有项目
        $cookieRole = isset($_COOKIE['hx_role']) ? intval($_COOKIE['hx_role']) : intval($user['role']);
        if ($cookieRole != 1) {
            jsonResponse(403, '无权限访问此功能');
        }

        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        $sql = "SELECT p.id, p.uuid, p.name, p.status, p.approval_status, p.budget, p.start_date, p.end_date, p.progress, p.created_at, u.real_name as creator_name, d.name as department_name FROM projects p LEFT JOIN users u ON p.creator_id = u.id LEFT JOIN departments d ON p.department_id = d.id";
        if (!empty($status)) {
            $sql .= " WHERE p.approval_status = '" . $db->real_escape_string($status) . "'";
        }
        $sql .= " ORDER BY p.created_at DESC";
        $result = $db->query($sql);
        $projects = [];
        while ($row = $result->fetch_assoc()) {
            $projects[] = $row;
        }
        jsonResponse(0, 'success', $projects);
        break;

    default:
        jsonResponse(1, '未知操作');
}
