export const compatibilityMap: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/**
 * Returns a list of compatible blood groups that can donate to a requested group.
 * @param requestedGroup - The blood group needed
 */
export const getCompatibleDonorGroups = (requestedGroup: string): string[] =>
  Object.keys(compatibilityMap).filter((donorGroup) =>
    compatibilityMap[donorGroup].includes(requestedGroup)
  );
