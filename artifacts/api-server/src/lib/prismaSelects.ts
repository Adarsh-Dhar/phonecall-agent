/**
 * Shared Prisma select fragments to avoid duplication across routes.
 */

/**
 * Contact card select - basic contact info for UI cards
 */
export const contactCardSelect = {
  id: true,
  name: true,
  business: true,
  initials: true,
  color: true,
} as const;

/**
 * Contact card select with phone number
 */
export const contactCardSelectWithPhone = {
  ...contactCardSelect,
  phone: true,
} as const;

/**
 * Sources include - for queries/tasks that reference source messages
 */
export const sourcesInclude = {
  sources: {
    include: {
      message: {
        select: {
          id: true,
          role: true,
          time: true,
          content: true,
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
} as const;
