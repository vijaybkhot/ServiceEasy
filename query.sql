WITH joined_data AS (
    SELECT 
        m.conversation_id,
        m.content AS resolved_content,
        m.created_at AS resolved_time,
        u.phone_number
    FROM messages m
    INNER JOIN conversations c ON c.id = m.conversation_id
    INNER JOIN contacts u ON c.contact_id = u.id
),
required_msg AS (
    SELECT 
        jd.conversation_id,
        jd.resolved_content,
        jd.resolved_time,
        jd.phone_number
    FROM joined_data jd
    WHERE 
        jd.resolved_content ILIKE '%Conversation was marked resolved%'
        AND jd.resolved_time BETWEEN '2024-11-02' AND '2024-11-15'
),
messages_after_resolve AS (
    SELECT 
        m.conversation_id,
        m.content AS message_content,
        m.created_at AS message_time
    FROM messages m
),
msg_within_24hrs AS (
    SELECT 
        rm.phone_number,
        mar.message_content,
        mar.message_time,
        rm.resolved_time,
        rm.conversation_id
    FROM required_msg rm
    INNER JOIN messages_after_resolve mar 
        ON rm.conversation_id = mar.conversation_id
    WHERE 
        mar.message_time BETWEEN rm.resolved_time AND rm.resolved_time + INTERVAL '24 hours'
)
SELECT 
    mw.phone_number,
    STRING_AGG(mw.message_content, '<------>' ORDER BY mw.message_time) AS users_message,
    (mw.resolved_time + INTERVAL '5 hours 30 minutes')::DATE AS resolved_date,
    CONCAT('https://omniverse.gagahealth.com/app/accounts/1/conversations/', mw.conversation_id) AS conversation_url
FROM msg_within_24hrs mw
GROUP BY 
    mw.conversation_id, mw.phone_number, mw.resolved_time
ORDER BY 
    resolved_date DESC, mw.phone_number DESC;