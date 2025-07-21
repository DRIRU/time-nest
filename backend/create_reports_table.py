"""
Create Reports Table Migration

This script creates the reports table for tracking user reports and disputes.
Run this after adding the Report model to create the necessary database table.
"""

CREATE_REPORTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS reports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_service_id INTEGER NULL,
    reported_request_id INTEGER NULL,
    reported_user_id INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'service_quality', 
        'fraud_scam', 
        'inappropriate_content', 
        'payment_dispute', 
        'no_show', 
        'unprofessional_behavior',
        'safety_concern',
        'other'
    )),
    category VARCHAR(10) NOT NULL CHECK (category IN ('service', 'request')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 
        'under_review', 
        'resolved', 
        'dismissed',
        'escalated'
    )),
    assigned_admin_id INTEGER NULL,
    admin_notes TEXT NULL,
    resolution TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_request_id) REFERENCES requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES admins(admin_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin_id ON reports(assigned_admin_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_reports_updated_at 
    AFTER UPDATE ON reports
    FOR EACH ROW
    BEGIN
        UPDATE reports SET updated_at = CURRENT_TIMESTAMP WHERE report_id = NEW.report_id;
    END;
"""

if __name__ == "__main__":
    import sqlite3
    import os
    
    # Path to your database
    db_path = "app.db"
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        exit(1)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Execute the SQL
        cursor.executescript(CREATE_REPORTS_TABLE_SQL)
        
        conn.commit()
        print("Reports table created successfully!")
        
        # Verify the table was created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reports';")
        result = cursor.fetchone()
        
        if result:
            print("✓ Reports table exists in database")
            
            # Show table structure
            cursor.execute("PRAGMA table_info(reports);")
            columns = cursor.fetchall()
            print("\nTable structure:")
            for col in columns:
                print(f"  {col[1]} ({col[2]})")
        else:
            print("✗ Failed to create reports table")
            
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        conn.close()
