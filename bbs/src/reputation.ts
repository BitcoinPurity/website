export type ActivityAction = "new_thread" | "reply";

export type Level = {
  name: string;
  minPoints: number;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};

export const LEVELS: Level[] = [
  { name: "Newbie", minPoints: 0 },
  { name: "Jr. Member", minPoints: 30 },
  { name: "Member", minPoints: 60 },
  { name: "Full Member", minPoints: 120 },
  { name: "Sr. Member", minPoints: 240 },
  { name: "Hero Member", minPoints: 480 },
  { name: "Legendary", minPoints: 960 },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "registered",
    name: "Registered",
    description: "Joined the Bitcoin Purity BBS.",
    sortOrder: 1,
  },
  {
    id: "first_thread",
    name: "First Topic",
    description: "Started your first discussion topic.",
    sortOrder: 2,
  },
  {
    id: "first_reply",
    name: "First Reply",
    description: "Posted your first reply.",
    sortOrder: 3,
  },
  {
    id: "posts_10",
    name: "10 Posts",
    description: "Made 10 posts on the forum.",
    sortOrder: 4,
  },
  {
    id: "posts_50",
    name: "50 Posts",
    description: "Made 50 posts on the forum.",
    sortOrder: 5,
  },
  {
    id: "threads_5",
    name: "5 Topics",
    description: "Started 5 discussion topics.",
    sortOrder: 6,
  },
  {
    id: "activity_100",
    name: "100 Activity",
    description: "Reached 100 activity points.",
    sortOrder: 7,
  },
  {
    id: "activity_500",
    name: "500 Activity",
    description: "Reached 500 activity points.",
    sortOrder: 8,
  },
];

export function pointsForAction(action: ActivityAction): number {
  if (action === "new_thread") return 5;
  return 2;
}

export function levelFromPoints(points: number): string {
  let level = LEVELS[0].name;
  for (const entry of LEVELS) {
    if (points >= entry.minPoints) level = entry.name;
  }
  return level;
}

export type UserStats = {
  points: number;
  postCount: number;
  threadCount: number;
  replyCount: number;
};

export function badgesEarned(stats: UserStats, existing: Set<string>): string[] {
  const earned: string[] = [];
  const { points, postCount, threadCount, replyCount } = stats;

  const check = (id: string, condition: boolean) => {
    if (condition && !existing.has(id)) earned.push(id);
  };

  check("registered", true);
  check("first_thread", threadCount >= 1);
  check("first_reply", replyCount >= 1);
  check("posts_10", postCount >= 10);
  check("posts_50", postCount >= 50);
  check("threads_5", threadCount >= 5);
  check("activity_100", points >= 100);
  check("activity_500", points >= 500);

  return earned;
}

export function computePointsFromCounts(threadCount: number, replyCount: number): number {
  return threadCount * pointsForAction("new_thread") + replyCount * pointsForAction("reply");
}
