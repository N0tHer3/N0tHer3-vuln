-- N0tHer3-vuln 内部靶场 - 数据库初始化脚本
-- 使用前请确保MySQL服务已启动，且secure_file_priv设置为空（支持os-shell）

CREATE DATABASE IF NOT EXISTS tangyuan_oa DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;
USE tangyuan_oa;

-- 部门表
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    parent_id INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    manager_id INT DEFAULT NULL,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,
    role TINYINT DEFAULT 0,
    real_name VARCHAR(20) NOT NULL,
    phone VARCHAR(15),
    id_card VARCHAR(18),
    email VARCHAR(50),
    department_id INT,
    position VARCHAR(30),
    avatar VARCHAR(200),
    entry_date DATE,
    status TINYINT DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 通知公告表
DROP TABLE IF EXISTS announcements;
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INT,
    category VARCHAR(20) DEFAULT '通知',
    is_top TINYINT DEFAULT 0,
    view_count INT DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目信息表
DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id INT,
    manager_id INT,
    department_id INT,
    status VARCHAR(20) DEFAULT '进行中',
    approval_status VARCHAR(20) DEFAULT '已通过',
    approval_remark TEXT,
    approver_id INT,
    budget DECIMAL(12,2) DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    progress INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统日志表
DROP TABLE IF EXISTS sys_logs;
CREATE TABLE sys_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50),
    action VARCHAR(100),
    module VARCHAR(30),
    ip_address VARCHAR(45),
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统配置表
DROP TABLE IF EXISTS sys_config;
CREATE TABLE sys_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 考勤记录表
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    check_in_time DATETIME,
    check_out_time DATETIME,
    status VARCHAR(10) DEFAULT '正常',
    date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 请假申请表
DROP TABLE IF EXISTS leave_requests;
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(20),
    start_date DATE,
    end_date DATE,
    days DECIMAL(4,1),
    reason TEXT,
    status VARCHAR(10) DEFAULT '待审批',
    approver_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 文档管理表
DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    filename VARCHAR(200),
    filepath VARCHAR(300),
    category VARCHAR(30),
    uploader_id INT,
    size BIGINT DEFAULT 0,
    download_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入部门数据
INSERT INTO departments (id, name, code, parent_id, sort_order) VALUES
(1, '技术研发部', 'TECH', 0, 1),
(2, '市场运营部', 'MKT', 0, 2),
(3, '人力资源部', 'HR', 0, 3),
(4, '财务管理部', 'FIN', 0, 4),
(5, '行政综合部', 'ADM', 0, 5),
(6, '产品设计部', 'PD', 0, 6);

-- 插入用户数据
-- 密码使用MySQL MD5()函数生成
-- 管理员密码: admin@1234 (MD5: 7ece99e593ff5dd200e2b9233d9ba654) 可免费MD5网站查询
INSERT INTO users (id, uuid, username, password, role, real_name, phone, id_card, email, department_id, position, avatar, entry_date, status) VALUES
(1, 'a3e7f1b2-4c5d-6e8f-9a0b-1c2d3e4f5a6b', 'admin', MD5('admin@1234'), 1, '系统管理员', '13800138001', '110108198505120037', 'admin@n0ther3.github.io', 1, '技术总监', 'TY.png', '2018-03-01', 1),
(2, 'b5f8e2c3-6d7e-8f9a-0b1c-2d3e4f5a6b7c', 'zhangwei', MD5('zhang123'), 0, '张伟', '13912345678', '320106199203150418', 'zhangwei@n0ther3.github.io', 1, '高级工程师', 'TY.png', '2019-07-15', 1),
(3, 'c7a9d3e4-8f1a-2b3c-4d5e-6f7a8b9c0d1e', 'wangfang', MD5('wang123'), 0, '王芳', '13823456789', '330102199108230625', 'wangfang@n0ther3.github.io', 2, '运营经理', '', '2019-09-01', 1),
(4, 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'lina', MD5('lina123'), 0, '李娜', '13734567890', '440106199305180831', 'lina@n0ther3.github.io', 3, 'HR主管', '', '2020-01-10', 1),
(5, 'e2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'liuyang', MD5('liu123'), 0, '刘洋', '13645678901', '510105199412071049', 'liuyang@n0ther3.github.io', 1, '前端工程师', '', '2020-03-20', 1),
(6, 'f3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'chenjing', MD5('chen123'), 0, '陈静', '13556789012', '210102199007261256', 'chenjing@n0ther3.github.io', 4, '财务专员', '', '2020-06-01', 1),
(7, 'a4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'yanglei', MD5('yang123'), 0, '杨磊', '13467890123', '420105199601030361', 'yanglei@n0ther3.github.io', 6, '产品经理', '', '2020-08-15', 1),
(8, 'b5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'zhaomin', MD5('zhao123'), 0, '赵敏', '13378901234', '610104199811290478', 'zhaomin@n0ther3.github.io', 5, '行政助理', '', '2021-01-05', 1),
(9, 'c6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'huangqiang', MD5('huang123'), 0, '黄强', '13289012345', '500105199504160584', 'huangqiang@n0ther3.github.io', 1, '后端工程师', '', '2021-03-10', 1),
(10, 'd7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'zhouli', MD5('zhou123'), 0, '周丽', '13190123456', '120102199209082691', 'zhouli@n0ther3.github.io', 2, '市场专员', '', '2021-05-20', 1),
(11, 'e8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', 'wugang', MD5('wu123'), 0, '吴刚', '13001234567', '370105199708250107', 'wugang@n0ther3.github.io', 1, '测试工程师', '', '2021-07-01', 1),
(12, 'f9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', 'xuhui', MD5('xu123'), 0, '徐慧', '12912345678', '230103199412310213', 'xuhui@n0ther3.github.io', 3, '招聘专员', '', '2021-09-15', 1),
(13, 'a0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a', 'suntao', MD5('sun123'), 0, '孙涛', '12823456789', '430104199606174329', 'suntao@n0ther3.github.io', 6, 'UI设计师', '', '2022-01-10', 1),
(14, 'b1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b', 'mxiuying', MD5('ma123'), 0, '马秀英', '12734567890', '620105199003085435', 'mxiuying@n0ther3.github.io', 4, '会计', '', '2022-03-01', 1),
(15, 'c2a3b4c5-d6e7-8f9a-0b1c-2d3e4f5a6b7c', 'zhujun', MD5('zhu123'), 0, '朱军', '12645678901', '810105199510226541', 'zhujun@n0ther3.github.io', 5, '网络管理员', '', '2022-05-15', 1),
(16, 'd3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d', 'hujie', MD5('hu123'), 0, '胡杰', '12556789012', '340105199801146757', 'hujie@n0ther3.github.io', 1, '架构师', '', '2019-04-20', 1),
(17, 'e4c5d6e7-f8a9-0b1c-2d3e-4f5a6b7c8d9e', 'guoling', MD5('guo123'), 0, '郭玲', '12467890123', '220103199207287863', 'guoling@n0ther3.github.io', 3, '培训主管', '', '2020-10-01', 1),
(18, 'f5d6e7f8-a9b0-1c2d-3e4f-5a6b7c8d9e0f', 'linfeng', MD5('lin123'), 0, '林峰', '12378901234', '310105199409058979', 'linfeng@n0ther3.github.io', 2, '品牌主管', '', '2021-02-18', 1),
(19, 'a6e7f8a9-b0c1-2d3e-4f5a-6b7c8d9e0f1a', 'heyan', MD5('he123'), 0, '何艳', '12289012345', '140105199911129085', 'heyan@n0ther3.github.io', 6, '交互设计师', '', '2022-07-01', 1),
(20, 'b7f8a9b0-c1d2-3e4f-5a6b-7c8d9e0f1a2b', 'gaojie', MD5('gao123'), 0, '高杰', '12190123456', '520105199308200191', 'gaojie@n0ther3.github.io', 1, '运维工程师', '', '2021-11-10', 1);

-- 更新部门manager_id
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 3 WHERE id = 2;
UPDATE departments SET manager_id = 4 WHERE id = 3;
UPDATE departments SET manager_id = 6 WHERE id = 4;
UPDATE departments SET manager_id = 8 WHERE id = 5;
UPDATE departments SET manager_id = 7 WHERE id = 6;

-- 插入通知公告数据
INSERT INTO announcements (title, content, author_id, category, is_top, view_count, published_at) VALUES
('关于2024年度绩效考核的通知', '各部门：\n\n根据公司年度工作安排，现启动2024年度绩效考核工作。请各部门负责人于12月20日前完成本部门员工的绩效评定，并将评定结果提交至人力资源部。\n\n具体考核标准和流程详见附件。如有疑问，请联系人力资源部李娜（分机8023）。\n\n人力资源部\n2024年11月15日', 4, '通知', 1, 356, '2024-11-15 09:00:00'),
('汤圆OA 2025年春节放假安排', '全体员工：\n\n根据国务院办公厅通知，2025年春节放假安排如下：\n\n1月28日（除夕）至2月4日（初七）放假调休，共8天。1月26日（周日）、2月8日（周六）上班。\n\n请各部门提前安排好节前工作，确保重要业务连续性。值班安排请于1月20日前报行政综合部。\n\n行政综合部\n2024年12月10日', 8, '通知', 1, 892, '2024-12-10 14:30:00'),
('关于启用新版OA系统的重要通知', '各位同事：\n\n为提升办公效率，公司将于2025年1月6日正式启用新版协同办公系统。新系统支持移动端访问，功能涵盖审批流程、文档协作、即时通讯等模块。\n\n请各位于1月3日前完成新系统登录测试，初始账号密码已通过企业微信发送。如遇问题请联系技术支持（分机9001）。\n\n技术研发部\n2024年12月25日', 1, '公告', 0, 567, '2024-12-25 10:00:00'),
('市场运营部Q4客户拜访计划', '市场运营部全体：\n\n第四季度客户拜访计划已制定完成，请各区域负责人按照计划执行客户回访工作。重点客户清单及拜访要点详见内部文档系统。\n\n关键节点：\n- 11月底前完成重点客户首轮回访\n- 12月15日前提交客户需求分析报告\n- 12月底前完成年度客户满意度调查\n\n市场运营部\n2024年10月28日', 3, '通知', 0, 234, '2024-10-28 11:00:00'),
('关于开展网络安全培训的通知', '全体员工：\n\n为增强全员网络安全意识，公司定于12月18日-20日分批次开展网络安全专题培训。\n\n培训内容：\n1. 常见网络威胁识别与防范\n2. 密码安全与账号保护\n3. 数据分类与保密规范\n4. 钓鱼邮件识别\n\n请各部门按照分配时段参加，不得缺席。\n\n行政综合部\n2024年12月05日', 8, '通知', 0, 445, '2024-12-05 16:00:00'),
('技术研发部项目规范更新说明', '技术研发部全体：\n\n为规范项目管理流程，现对以下规范进行更新：\n\n1. 代码规范：新增前端TypeScript编码规范\n2. 分支策略：采用Git Flow标准分支模型\n3. 评审要求：所有合并请求需至少2人评审通过\n4. 发布流程：增加灰度发布环节\n\n新规范自2025年1月1日起执行，请各项目组及时调整。\n\n技术研发部\n2024年12-15', 2, '公告', 0, 189, '2024-12-15 09:30:00'),
('关于调整住房公积金缴存比例的通知', '全体员工：\n\n接住房公积金管理中心通知，自2025年1月1日起，我司住房公积金缴存比例由12%调整为10%。相应地，每月个人和单位缴存金额将有所变化。\n\n具体影响金额将体现在1月份工资条中，届时请注意查收。如有疑问，请联系财務管理部陈静（分机8045）。\n\n财務管理部\n2024年12月20日', 6, '通知', 0, 678, '2024-12-20 15:00:00'),
('产品设计部2025年产品路线图发布', '产品设计部全体及相关协作部门：\n\n2025年产品路线图已经制定完成，主要方向包括：\n\n1. 智能化升级：核心产品增加AI辅助决策模块\n2. 移动化拓展：全部产品线支持移动端\n3. 开放平台：构建开发者生态\n4. 国际化：支持多语言多币种\n\n详细路线图文档已上传至文档中心，请各相关方评审并提出意见。\n\n产品设计部\n2024年12月28日', 7, '公告', 0, 312, '2024-12-28 10:30:00'),
('关于年度体检安排的通知', '全体员工：\n\n2024年度员工健康体检安排如下：\n\n时间：2025年1月13日-17日\n地点：市第一人民医院体检中心（建国路128号）\n\n注意事项：\n1. 体检前一天晚上10点后禁食禁水\n2. 携带本人身份证原件\n3. 按部门分配日期前往\n\n具体日期分配及体检项目详见附件。\n\n人力资源部\n2024年12月30日', 4, '通知', 0, 523, '2024-12-30 11:30:00'),
('关于规范办公用品申领流程的说明', '各部门：\n\n为优化资源配置，现对办公用品申领流程进行规范：\n\n1. 每月5日前通过OA系统提交申领申请\n2. 单次申领金额超500元需部门负责人审批\n3. 常规办公耗材由行政综合部统一采购\n4. 专用设备需提前一个月提交采购申请\n\n新流程自2025年2月1日起执行。\n\n行政综合部\n2025年1月2日', 8, '通知', 0, 167, '2025-01-02 09:00:00');

-- 插入项目数据
INSERT INTO projects (uuid, name, description, creator_id, manager_id, department_id, status, approval_status, budget, start_date, end_date, progress) VALUES
('p001-aaaa-bbbb-cccc-dddd0001', '智慧供应链管理平台V3.0', '基于微服务架构重构供应链管理系统，新增智能补货、库存预警等模块', 2, 2, 1, '进行中', '已通过', 850000.00, '2024-06-01', '2025-03-31', 65),
('p002-aaaa-bbbb-cccc-dddd0002', '客户关系管理系统升级', 'CRM系统功能扩展，增加客户画像、智能推荐、数据看板功能', 3, 3, 2, '进行中', '已通过', 620000.00, '2024-09-01', '2025-06-30', 40),
('p003-aaaa-bbbb-cccc-dddd0003', '移动办公平台开发', '开发跨平台移动办公应用，支持iOS和Android，实现核心业务移动化', 5, 5, 1, '进行中', '待审批', 480000.00, '2024-10-15', '2025-05-31', 25),
('p004-aaaa-bbbb-cccc-dddd0004', '数据中台建设项目', '构建企业级数据中台，统一数据标准，提供数据服务和数据治理能力', 16, 16, 1, '进行中', '已通过', 1200000.00, '2024-04-01', '2025-08-31', 50),
('p005-aaaa-bbbb-cccc-dddd0005', '品牌官网改版', '全新设计品牌官网，提升品牌形象和用户体验，增加在线客服功能', 18, 18, 2, '已完成', '已通过', 350000.00, '2024-07-01', '2024-12-31', 100),
('p006-aaaa-bbbb-cccc-dddd0006', 'HR自助服务系统', '员工自助服务平台，支持请假、考勤查询、工资条查看等功能', 4, 4, 3, '进行中', '待审批', 280000.00, '2024-11-01', '2025-04-30', 30),
('p007-aaaa-bbbb-cccc-dddd0007', '财务报表自动化', '实现财务报表自动生成和数据校验，减少人工操作和出错率', 6, 6, 4, '规划中', '待审批', 320000.00, '2025-01-01', '2025-07-31', 0),
('p008-aaaa-bbbb-cccc-dddd0008', '智能客服系统', '基于NLP技术构建智能客服机器人，实现7x24小时自动应答', 7, 7, 6, '规划中', '待审批', 550000.00, '2025-02-01', '2025-09-30', 0);

-- 插入系统配置
INSERT INTO sys_config (config_key, config_value, description) VALUES
('site_name', 'N0tHer3-vuln 内部靶场', '系统名称'),
('site_version', '3.2.1', '系统版本'),
('upload_max_size', '10485760', '上传文件大小限制(字节)'),
('upload_allowed_types', 'jpg,jpeg,png,gif,bmp,doc,docx,pdf,xls,xlsx', '允许上传的文件类型'),
('session_timeout', '1800', '会话超时时间(秒)'),
('password_min_length', '8', '密码最小长度'),
('db_host', 'localhost', '数据库主机'),
('db_port', '3306', '数据库端口'),
('db_name', 'tangyuan_oa', '数据库名称'),
('db_user', 'root', '数据库用户'),
('db_password', 'root', '数据库密码'),
('mail_server', 'smtp.n0ther3.github.io', '邮件服务器'),
('mail_port', '465', '邮件端口'),
('backup_path', '/data/backups/tangyuan', '备份路径'),
('log_level', 'INFO', '日志级别'),
('max_login_attempts', '5', '最大登录尝试次数');

-- 插入系统日志
INSERT INTO sys_logs (user_id, username, action, module, ip_address, detail, created_at) VALUES
(1, 'admin', '登录系统', '认证', '192.168.1.100', '管理员登录', '2025-01-03 08:30:15'),
(2, 'zhangwei', '登录系统', '认证', '192.168.1.56', '用户登录', '2025-01-03 08:35:22'),
(3, 'wangfang', '登录系统', '认证', '192.168.1.78', '用户登录', '2025-01-03 08:42:08'),
(1, 'admin', '修改配置', '系统', '192.168.1.100', '修改上传文件大小限制', '2025-01-03 09:15:33'),
(2, 'zhangwei', '提交代码', '项目', '192.168.1.56', '智慧供应链项目提交', '2025-01-03 10:20:45'),
(4, 'lina', '审批请假', '人事', '192.168.1.78', '审批刘洋年假申请', '2025-01-03 11:05:17'),
(5, 'liuyang', '上传文档', '文档', '192.168.1.92', '上传技术规范文档', '2025-01-03 13:30:28'),
(1, 'admin', '查看日志', '系统', '192.168.1.100', '查看系统运行日志', '2025-01-03 14:10:55'),
(3, 'wangfang', '导出报表', '报表', '192.168.1.78', '导出Q4客户数据', '2025-01-03 15:22:40'),
(6, 'chenjing', '审批报销', '财务', '192.168.1.65', '审批市场部差旅报销', '2025-01-03 16:08:33');

-- 插入考勤数据
INSERT INTO attendance (user_id, check_in_time, check_out_time, status, date) VALUES
(1, '2025-01-03 08:28:00', '2025-01-03 18:05:00', '正常', '2025-01-03'),
(2, '2025-01-03 08:32:00', '2025-01-03 18:15:00', '正常', '2025-01-03'),
(3, '2025-01-03 08:40:00', '2025-01-03 18:00:00', '正常', '2025-01-03'),
(4, '2025-01-03 08:55:00', '2025-01-03 18:10:00', '迟到', '2025-01-03'),
(5, '2025-01-03 08:30:00', '2025-01-03 18:20:00', '正常', '2025-01-03');

-- 插入请假数据
INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, approver_id) VALUES
(5, '年假', '2025-01-06', '2025-01-08', 3, '回老家处理家事', '已批准', 4),
(10, '事假', '2025-01-10', '2025-01-10', 1, '个人事务', '待审批', 3),
(13, '调休', '2025-01-13', '2025-01-13', 1, '周末加班调休', '已批准', 7);

-- 插入文档数据
INSERT INTO documents (title, filename, filepath, category, uploader_id, size, download_count) VALUES
('2024年度绩效考核方案', '绩效考核方案_v2.docx', '/data/docs/2024/绩效考核方案_v2.docx', '制度文件', 4, 245760, 23),
('代码规范V3.0', '代码规范_v3.pdf', '/data/docs/tech/代码规范_v3.pdf', '技术文档', 2, 184320, 56),
('客户拜访计划Q4', '客户拜访_Q4.xlsx', '/data/docs/mkt/客户拜访_Q4.xlsx', '业务文档', 3, 327680, 18),
('网络安全培训课件', '安全培训.pptx', '/data/docs/training/安全培训.pptx', '培训资料', 8, 5242880, 42),
('供应链系统架构设计', '架构设计_v4.pdf', '/data/docs/tech/架构设计_v4.pdf', '技术文档', 16, 1024000, 31),
('品牌视觉规范', 'VI规范_2024.pdf', '/data/docs/design/VI规范_2024.pdf', '设计规范', 13, 3145728, 27);

-- 授予当前MySQL用户FILE权限（如已有则忽略）
-- GRANT FILE ON *.* TO CURRENT_USER();
-- FLUSH PRIVILEGES;

-- 提示：为支持sqlmap os-shell，请确保my.ini/my.cnf中设置：
-- secure_file_priv = ""
-- 且MySQL服务对Web目录有写入权限
