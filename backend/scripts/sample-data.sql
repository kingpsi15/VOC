-- Sample data for feedback table
-- Run this if you want to add more sample data manually
USE feedback_db;

INSERT INTO feedback (id, customer_name, service_type, review_text, review_rating, sentiment, status, issue_location, positive_flag, negative_flag) VALUES
('fb_006', 'John Tan', 'ATM', 'ATM dispenser jammed and ate my card. Had to wait 5 days for replacement.', 1, 'negative', 'escalated', 'Kuala Lumpur', false, true),
('fb_007', 'Sarah Lee', 'OnlineBanking', 'The new mobile app update is fantastic! Much easier to navigate.', 5, 'positive', 'resolved', 'Selangor', true, false),
('fb_008', 'Muhammad Ali', 'CoreBanking', 'Branch staff were professional but the waiting time was too long.', 3, 'neutral', 'in_progress', 'Penang', false, false),
('fb_009', 'Chen Wei', 'ATM', 'ATM location is convenient but often runs out of cash on weekends.', 2, 'negative', 'new', 'Johor Bahru', false, true),
('fb_010', 'Priya Nair', 'OnlineBanking', 'Love the instant transfer feature. Works perfectly every time.', 5, 'positive', 'resolved', 'Melaka', true, false),
('fb_011', 'David Wong', 'CoreBanking', 'Excellent customer service at the main branch. Highly recommended.', 5, 'positive', 'resolved', 'Kuala Lumpur', true, false),
('fb_012', 'Aisha Rahman', 'ATM', 'Screen was broken and hard to read. Please fix it soon.', 2, 'negative', 'new', 'Selangor', false, true),
('fb_013', 'Kumar Samy', 'OnlineBanking', 'Internet banking is reliable but could use better security features.', 4, 'positive', 'in_progress', 'Penang', true, false),
('fb_014', 'Lisa Chong', 'CoreBanking', 'Very helpful staff assisted me with my investment portfolio.', 4, 'positive', 'resolved', 'Johor Bahru', true, false),
('fb_015', 'Hassan Ibrahim', 'ATM', 'Great location and always working properly. No issues so far.', 4, 'positive', 'resolved', 'Melaka', true, false);

UPDATE feedback SET sentiment = 'negative' WHERE review_rating <= 3 AND review_rating > 0;
UPDATE feedback SET sentiment = 'positive' WHERE review_rating >= 4;