-- Create moderators table for storing moderator credentials and details
CREATE TABLE IF NOT EXISTS moderators (
    moderator_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Reference to the original user record',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email for moderator login (copied from user table)',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Password hash for moderator authentication',
    first_name VARCHAR(50) NOT NULL COMMENT 'First name copied from user table',
    last_name VARCHAR(50) NOT NULL COMMENT 'Last name copied from user table',
    phone_number VARCHAR(15) COMMENT 'Phone number copied from user table',
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active' COMMENT 'Moderator account status',
    permissions JSON COMMENT 'JSON object containing moderator permissions',
    assigned_regions JSON COMMENT 'JSON array of regions this moderator is responsible for',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When moderator account was created',
    last_login TIMESTAMP NULL COMMENT 'Last login timestamp',
    last_activity TIMESTAMP NULL COMMENT 'Last activity timestamp',
    approved_by INT COMMENT 'Admin ID who approved this moderator',
    mod_request_id INT COMMENT 'Reference to the original moderator request',
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (mod_request_id) REFERENCES mod_requests(request_id) ON DELETE SET NULL,
    
    -- Indexes for better query performance
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_last_login (last_login),
    INDEX idx_mod_request_id (mod_request_id),
    
    -- Ensure one moderator record per user
    UNIQUE KEY unique_user_moderator (user_id)
);

-- Default permissions structure for reference
-- {
--   "content_moderation": true,
--   "user_management": true,
--   "report_handling": true,
--   "service_review": true,
--   "comment_moderation": true,
--   "suspension_authority": false,
--   "delete_content": true,
--   "view_user_details": true
-- }

-- Create a view for moderator details with user information
CREATE VIEW moderator_details AS
SELECT 
    m.moderator_id,
    m.user_id,
    m.email,
    m.first_name,
    m.last_name,
    m.phone_number,
    m.status as moderator_status,
    m.permissions,
    m.assigned_regions,
    m.created_at as moderator_since,
    m.last_login,
    m.last_activity,
    m.approved_by,
    m.mod_request_id,
    u.location as user_location,
    u.date_joined as user_date_joined,
    u.status as user_status,
    mr.reason as application_reason,
    mr.experience as application_experience,
    mr.submitted_at as application_date
FROM moderators m
LEFT JOIN users u ON m.user_id = u.user_id
LEFT JOIN mod_requests mr ON m.mod_request_id = mr.request_id;
