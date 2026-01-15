import { Permission, Role } from 'node-appwrite';

/**
 * Permission Helper Functions
 * Generate permission arrays for documents based on user roles and team membership
 */

/**
 * Generate permissions for a claim document
 *
 * @param userId - The user who created the claim
 * @param insuranceCompanyTeamId - The team ID of the insurance company (optional)
 * @param isPublic - Whether the claim should be publicly readable
 * @returns Array of permission strings
 *
 * @example
 * // User creates claim with insurance company
 * getClaimPermissions(userId, teamId, false)
 * // Returns: [Permission.read(Role.user(userId)), Permission.read(Role.team(teamId)), Permission.update(Role.team(teamId))]
 *
 * // Approved claim made public
 * getClaimPermissions(userId, teamId, true)
 * // Returns: [...previous, Permission.read(Role.any())]
 */
export function getClaimPermissions(
  userId: string,
  insuranceCompanyTeamId?: string,
  isPublic = false
): string[] {
  const permissions = [
    Permission.read(Role.user(userId)), // Owner read-only
  ];

  if (insuranceCompanyTeamId) {
    permissions.push(
      Permission.read(Role.team(insuranceCompanyTeamId)),
      Permission.update(Role.team(insuranceCompanyTeamId))
    );
  }

  if (isPublic) {
    permissions.push(Permission.read(Role.any()));
  }

  return permissions;
}

/**
 * Generate permissions for claim-related documents (damage_details, vehicle_verification, assessments)
 * Same as claim permissions but without the public option
 *
 * @param userId - The user who created the claim
 * @param insuranceCompanyTeamId - The team ID of the insurance company (optional)
 * @returns Array of permission strings
 *
 * @example
 * getClaimRelatedPermissions(userId, teamId)
 * // Returns: [Permission.read(Role.user(userId)), Permission.read(Role.team(teamId)), Permission.update(Role.team(teamId))]
 */
export function getClaimRelatedPermissions(
  userId: string,
  insuranceCompanyTeamId?: string
): string[] {
  const permissions = [
    Permission.read(Role.user(userId)),
  ];

  if (insuranceCompanyTeamId) {
    permissions.push(
      Permission.read(Role.team(insuranceCompanyTeamId)),
      Permission.update(Role.team(insuranceCompanyTeamId))
    );
  }

  return permissions;
}

/**
 * Generate permissions for user profile
 * Users can read and update their own profile
 *
 * @param userId - The user ID
 * @returns Array of permission strings
 *
 * @example
 * getUserPermissions(userId)
 * // Returns: [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))]
 */
export function getUserPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
  ];
}

/**
 * Generate permissions for insurance company (public read)
 * Anyone can read insurance companies (for form dropdowns)
 * Admins create/update via admin client
 *
 * @returns Array of permission strings
 *
 * @example
 * getInsuranceCompanyPermissions()
 * // Returns: [Permission.read(Role.any())]
 */
export function getInsuranceCompanyPermissions(): string[] {
  return [
    Permission.read(Role.any()),
  ];
}
