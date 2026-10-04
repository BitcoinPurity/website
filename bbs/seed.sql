CREATE TABLE IF NOT EXISTS bbs_migrations (name TEXT PRIMARY KEY);

-- Top-level categories (parent_id NULL)
INSERT OR IGNORE INTO boards (id, parent_id, name, slug, description, sort_order) VALUES
  (1, NULL, 'Bitcoin Purity', 'bitcoin-purity', 'Protocol, consensus, and the Purity vision.', 1),
  (2, NULL, 'Mining', 'mining', 'Proof-of-work, pools, and hash rate.', 2),
  (3, NULL, 'Development', 'development', 'Node software and protocol implementation.', 3),
  (4, NULL, 'Meta', 'meta', 'Forum feedback and off-topic conversation.', 99);

-- Sub-boards (parent_id set)
INSERT OR IGNORE INTO boards (id, parent_id, name, slug, description, sort_order) VALUES
  (11, 1, 'General Discussion', 'general-discussion', 'Community discussion about Bitcoin Purity.', 1),
  (12, 1, 'Consensus & Protocol', 'consensus-protocol', 'RDTS, hard fork rules, and consensus specification.', 2),
  (13, 1, 'Roadmap', 'roadmap', 'Short-term tree and longer research direction.', 3),
  (21, 2, 'Pool & Solo Mining', 'pool-solo-mining', 'Trial solo pool, stratum setup, and payout status.', 1),
  (22, 2, 'Hashrate & ASERT', 'hashrate-asert', 'Difficulty adjustment, hash rate, and block times.', 2),
  (31, 3, 'Node & Builds', 'node-builds', 'Building and running Bitcoin Purity nodes.', 1),
  (32, 3, 'Patches & PRs', 'patches-prs', 'Code changes, reviews, and implementation work.', 2),
  (41, 4, 'Forum Feedback', 'forum-feedback', 'Suggestions and issues about this BBS.', 1),
  (42, 4, 'Off-topic', 'off-topic', 'Non-Purity conversation.', 2);

INSERT INTO boards (parent_id, name, slug, description, sort_order)
SELECT category.id, 'Announcement', 'announcement',
       'Official announcements, releases, and project updates.', 0
FROM boards AS category
WHERE category.parent_id IS NULL AND category.name = 'Bitcoin Purity'
  AND NOT EXISTS (SELECT 1 FROM bbs_migrations WHERE name = 'announcement')
  AND NOT EXISTS (
    SELECT 1 FROM boards
    WHERE parent_id = category.id AND name = 'Announcement'
  );

INSERT OR IGNORE INTO bbs_migrations (name) VALUES ('announcement'), ('board_hierarchy');

INSERT OR IGNORE INTO badges (id, name, description, sort_order) VALUES
  ('registered', 'Registered', 'Joined the Bitcoin Purity BBS.', 1),
  ('first_thread', 'First Topic', 'Started your first discussion topic.', 2),
  ('first_reply', 'First Reply', 'Posted your first reply.', 3),
  ('posts_10', '10 Posts', 'Made 10 posts on the forum.', 4),
  ('posts_50', '50 Posts', 'Made 50 posts on the forum.', 5),
  ('threads_5', '5 Topics', 'Started 5 discussion topics.', 6),
  ('activity_100', '100 Activity', 'Reached 100 activity points.', 7),
  ('activity_500', '500 Activity', 'Reached 500 activity points.', 8);
