import type { Project } from "../../types";

export type ProjectMember = { id: string; name: string; avatarUrl?: string };

export type ProjectWithMeta = Project & {
  leadName: string;
  taskCount: number;
  members: ProjectMember[];
  /** Optional tags/skills for the card when provided by the API or parent */
  skills?: string[];
};
