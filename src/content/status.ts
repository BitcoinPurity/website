export type StatusKind =
  | "consensus"
  | "unchanged"
  | "local-policy"
  | "implemented"
  | "active-in-tree"
  | "specified"
  | "roadmap"
  | "safety";

export const statusLabel: Record<StatusKind, string> = {
  consensus: "CONSENSUS",
  unchanged: "UNCHANGED",
  "local-policy": "LOCAL POLICY",
  implemented: "IMPLEMENTED",
  "active-in-tree": "ACTIVE IN THIS TREE",
  specified: "SPECIFIED — NOT IMPLEMENTED",
  roadmap: "ROADMAP",
  safety: "SAFETY NOTE",
};
