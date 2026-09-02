-- Top-level categories (parent_id NULL)
INSERT OR IGNORE INTO boards (id, parent_id, name, description, sort_order) VALUES
  (1, NULL, 'Bitcoin Purity', 'Protocol, consensus, and the Purity vision.', 1),
  (2, NULL, 'Mining', 'Proof-of-work, pools, and hash rate.', 2),
  (3, NULL, 'Development', 'Node software and protocol implementation.', 3),
  (4, NULL, 'Meta', 'Forum feedback and off-topic conversation.', 99);

-- Sub-boards (parent_id set)
INSERT OR IGNORE INTO boards (id, parent_id, name, description, sort_order) VALUES
  (11, 1, 'General Discussion', 'Community discussion about Bitcoin Purity.', 1),
  (12, 1, 'Consensus & Protocol', 'RDTS, hard fork rules, and consensus specification.', 2),
  (13, 1, 'Roadmap', 'Short-term tree and longer research direction.', 3),
  (21, 2, 'Pool & Solo Mining', 'Trial solo pool, stratum setup, and payout status.', 1),
  (22, 2, 'Hashrate & ASERT', 'Difficulty adjustment, hash rate, and block times.', 2),
  (31, 3, 'Node & Builds', 'Building and running Bitcoin Purity nodes.', 1),
  (32, 3, 'Patches & PRs', 'Code changes, reviews, and implementation work.', 2),
  (41, 4, 'Forum Feedback', 'Suggestions and issues about this BBS.', 1),
  (42, 4, 'Off-topic', 'Non-Purity conversation.', 2);

INSERT OR IGNORE INTO badges (id, name, description, sort_order) VALUES
  ('registered', 'Registered', 'Joined the Bitcoin Purity BBS.', 1),
  ('first_thread', 'First Topic', 'Started your first discussion topic.', 2),
  ('first_reply', 'First Reply', 'Posted your first reply.', 3),
  ('posts_10', '10 Posts', 'Made 10 posts on the forum.', 4),
  ('posts_50', '50 Posts', 'Made 50 posts on the forum.', 5),
  ('threads_5', '5 Topics', 'Started 5 discussion topics.', 6),
  ('activity_100', '100 Activity', 'Reached 100 activity points.', 7),
  ('activity_500', '500 Activity', 'Reached 500 activity points.', 8);
