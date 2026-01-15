"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { ID } from 'node-appwrite';

/**
 * Team Management Functions
 * Manage Appwrite teams for insurance company access control
 */

/**
 * Create an Appwrite team for an insurance company
 *
 * @param companyName - The insurance company name
 * @param companyId - The insurance company document ID (for reference)
 * @returns Team ID or error
 *
 * @example
 * const result = await createInsuranceCompanyTeam("Acme Insurance", "comp123");
 * if (result.success) {
 *   console.log(result.teamId);
 * }
 */
export async function createInsuranceCompanyTeam(
  companyName: string,
  companyId: string
) {
  try {
    const { teams } = await adminAction();

    const team = await teams.create(
      ID.unique(),
      companyName,
      ['adjuster', 'manager'] // Available roles
    );

    return { success: true, teamId: team.$id };
  } catch (error) {
    console.error('Failed to create insurance company team:', error);
    return { success: false, message: 'Failed to create team' };
  }
}

/**
 * Add user to insurance company team
 *
 * @param teamId - The team ID
 * @param userId - The user ID to add
 * @param role - The role to assign ('adjuster' or 'manager')
 * @returns Success or error
 *
 * @example
 * const result = await addUserToCompanyTeam(teamId, userId, 'adjuster');
 * if (result.success) {
 *   console.log('User added to team');
 * }
 */
export async function addUserToCompanyTeam(
  teamId: string,
  userId: string,
  role: 'adjuster' | 'manager' = 'adjuster'
) {
  try {
    const { teams } = await adminAction();

    // Create membership with specific role
    await teams.createMembership(
      teamId,
      [role],
      undefined, // URL (optional)
      userId
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to add user to team:', error);
    return { success: false, message: 'Failed to add user to team' };
  }
}

/**
 * Remove user from insurance company team
 *
 * @param teamId - The team ID
 * @param membershipId - The membership ID to remove
 * @returns Success or error
 *
 * @example
 * const result = await removeUserFromCompanyTeam(teamId, membershipId);
 */
export async function removeUserFromCompanyTeam(
  teamId: string,
  membershipId: string
) {
  try {
    const { teams } = await adminAction();

    await teams.deleteMembership(teamId, membershipId);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove user from team:', error);
    return { success: false, message: 'Failed to remove user from team' };
  }
}

/**
 * Get all team members for an insurance company
 *
 * @param teamId - The team ID
 * @returns List of team members or error
 *
 * @example
 * const result = await getTeamMembers(teamId);
 * if (result.success) {
 *   console.log(result.members);
 * }
 */
export async function getTeamMembers(teamId: string) {
  try {
    const { teams } = await adminAction();

    const memberships = await teams.listMemberships(teamId);

    return { success: true, members: memberships.memberships };
  } catch (error) {
    console.error('Failed to get team members:', error);
    return { success: false, message: 'Failed to get team members' };
  }
}
