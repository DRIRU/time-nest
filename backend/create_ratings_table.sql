-- Create ratings table for storing service ratings and reviews
CREATE TABLE ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    rater_id INT NOT NULL COMMENT 'User ID of the person giving the rating (customer)',
    provider_id INT NOT NULL COMMENT 'User ID of the service provider being rated',
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT 'Rating value from 1 to 5 stars',
    review TEXT COMMENT 'Optional written review/feedback',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (assuming you have these tables)
    FOREIGN KEY (booking_id) REFERENCES service_bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (rater_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes for better query performance
    INDEX idx_service_id (service_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_rater_id (rater_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    
    -- Ensure one rating per booking
    UNIQUE KEY unique_booking_rating (booking_id),
    
    -- Ensure rater is not the same as provider
    CHECK (rater_id != provider_id)
);

-- Create a view to easily get service statistics
CREATE VIEW service_rating_stats AS
SELECT 
    s.service_id,
    s.title as service_title,
    COUNT(r.rating_id) as total_ratings,
    AVG(r.rating) as average_rating,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five_star_count,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as four_star_count,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as three_star_count,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as two_star_count,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one_star_count,
    MAX(r.created_at) as latest_rating_date
FROM services s
LEFT JOIN ratings r ON s.service_id = r.service_id
GROUP BY s.service_id, s.title;

-- Create a view to get provider ratings
CREATE VIEW provider_rating_stats AS
SELECT 
    u.user_id as provider_id,
    CONCAT(u.first_name, ' ', u.last_name) as provider_name,
    COUNT(r.rating_id) as total_ratings,
    AVG(r.rating) as average_rating,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five_star_count,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as four_star_count,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as three_star_count,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as two_star_count,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one_star_count,
    MAX(r.created_at) as latest_rating_date
FROM users u
LEFT JOIN ratings r ON u.user_id = r.provider_id
GROUP BY u.user_id, u.first_name, u.last_name;

-- Sample queries to verify the setup:

-- Get all ratings for a specific service
-- SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as rater_name 
-- FROM ratings r 
-- JOIN users u ON r.rater_id = u.user_id 
-- WHERE r.service_id = 1 
-- ORDER BY r.created_at DESC;

-- Get average rating for a service
-- SELECT service_id, AVG(rating) as avg_rating, COUNT(*) as total_ratings 
-- FROM ratings 
-- WHERE service_id = 1;

-- Get all ratings given by a user
-- SELECT r.*, s.title as service_title 
-- FROM ratings r 
-- JOIN services s ON r.service_id = s.service_id 
-- WHERE r.rater_id = 1 
-- ORDER BY r.created_at DESC;

-- Get all ratings received by a provider
-- SELECT r.*, s.title as service_title, CONCAT(u.first_name, ' ', u.last_name) as rater_name
-- FROM ratings r 
-- JOIN services s ON r.service_id = s.service_id 
-- JOIN users u ON r.rater_id = u.user_id 
-- WHERE r.provider_id = 1 
-- ORDER BY r.created_at DESC;
