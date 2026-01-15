"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID } from 'node-appwrite';
import { createInsuranceCompanyTeam } from './teams';
import { getInsuranceCompanyPermissions } from '@/lib/permissions';
import type { InsuranceCompanyDocument } from '@/lib/types/appwrite';

/**
 * Create Insurance Company Server Action
 * Creates both the insurance company document and its associated Appwrite team
 */

export interface CreateInsuranceCompanyInput {
  name: string;
  company_code: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
}

export interface CreateInsuranceCompanyResult {
  success: boolean;
  data?: InsuranceCompanyDocument;
  message?: string;
}

/**
 * Create a new insurance company with associated team
 *
 * @param data - Insurance company data
 * @returns Created insurance company document or error
 *
 * @example
 * const result = await createInsuranceCompany({
 *   name: "Acme Insurance",
 *   company_code: "ACME001",
 *   contact_email: "contact@acme.com"
 * });
 *
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
export async function createInsuranceCompany(
  data: CreateInsuranceCompanyInput
): Promise<CreateInsuranceCompanyResult> {
  try {
    const { databases } = await adminAction();

    // 1. Create Appwrite team for the insurance company
    const teamResult = await createInsuranceCompanyTeam(
      data.name,
      data.company_code
    );

    if (!teamResult.success) {
      return {
        success: false,
        message: 'Failed to create team for insurance company',
      };
    }

    // 2. Create insurance company document with team_id
    const company = await databases.createDocument<InsuranceCompanyDocument>(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      ID.unique(),
      {
        name: data.name,
        company_code: data.company_code,
        team_id: teamResult.teamId,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        website: data.website,
        is_active: true,
      },
      getInsuranceCompanyPermissions()
    );

    return { success: true, data: company };
  } catch (error: any) {
    console.error('Failed to create insurance company:', error);

    // Check for common errors
    if (error.code === 409) {
      return {
        success: false,
        message: 'Insurance company with this code already exists',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to create insurance company',
    };
  }
}

/**
 * Update insurance company
 * Note: Does not update team information
 *
 * @param companyId - Insurance company document ID
 * @param data - Fields to update
 * @returns Updated insurance company or error
 */
export async function updateInsuranceCompany(
  companyId: string,
  data: Partial<CreateInsuranceCompanyInput>
): Promise<CreateInsuranceCompanyResult> {
  try {
    const { databases } = await adminAction();

    const company = await databases.updateDocument<InsuranceCompanyDocument>(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      companyId,
      data
    );

    return { success: true, data: company };
  } catch (error: any) {
    console.error('Failed to update insurance company:', error);
    return {
      success: false,
      message: error.message || 'Failed to update insurance company',
    };
  }
}

/**
 * Get insurance company by ID
 *
 * @param companyId - Insurance company document ID
 * @returns Insurance company or error
 */
export async function getInsuranceCompany(
  companyId: string
): Promise<CreateInsuranceCompanyResult> {
  try {
    const { databases } = await adminAction();

    const company = await databases.getDocument<InsuranceCompanyDocument>(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      companyId
    );

    return { success: true, data: company };
  } catch (error: any) {
    console.error('Failed to get insurance company:', error);
    return {
      success: false,
      message: error.message || 'Failed to get insurance company',
    };
  }
}

/**
 * List all active insurance companies
 * Useful for form dropdowns
 *
 * @returns List of active insurance companies or error
 */
export async function listActiveInsuranceCompanies(): Promise<{
  success: boolean;
  data?: InsuranceCompanyDocument[];
  message?: string;
}> {
  try {
    const { databases } = await adminAction();

    const result = await databases.listDocuments<InsuranceCompanyDocument>(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      [
        // Query.equal('is_active', true) // Uncomment when using filter
      ]
    );

    return { success: true, data: result.documents };
  } catch (error: any) {
    console.error('Failed to list insurance companies:', error);
    return {
      success: false,
      message: error.message || 'Failed to list insurance companies',
    };
  }
}
