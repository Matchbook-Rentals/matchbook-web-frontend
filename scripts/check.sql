-- Category counts
SELECT category, COUNT(*) as cnt
FROM Listing
WHERE category IS NOT NULL
GROUP BY category
ORDER BY cnt DESC;

-- Non-canonical category listings with creation dates
SELECT category, DATE(createdAt) as created_date, COUNT(*) as cnt
FROM Listing
WHERE BINARY category NOT IN ('singleFamily', 'apartment', 'townhouse', 'privateRoom')
  AND category IS NOT NULL
GROUP BY category, DATE(createdAt)
ORDER BY category, created_date;
