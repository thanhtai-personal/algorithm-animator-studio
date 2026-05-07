export const categoryQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryQueryKeys.all, "list"] as const,
  list: (userId?: string) => [...categoryQueryKeys.lists(), userId] as const,
};
