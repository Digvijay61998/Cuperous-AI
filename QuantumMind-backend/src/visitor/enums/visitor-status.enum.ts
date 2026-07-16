export const VisitorStatusEnum = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;

export type VisitorStatusEnum =
  (typeof VisitorStatusEnum)[keyof typeof VisitorStatusEnum];

export const VisitorStatusEnumList = Object.values(VisitorStatusEnum);
