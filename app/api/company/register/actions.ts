"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID } from 'node-appwrite';
import type { InsuranceCompanyDocument } from '@/lib/types/appwrite';
import { getInsuranceCompanyPermissions } from '@/lib/permissions';
import { generateUniqueCompanyCode } from '@/lib/utils/generateCompanyCode';
import { sendCompanyCodeEmail } from '@/lib/email/sendCompanyCodeEmail';
import { createInsuranceCompanyTeam } from '@/appwrite/teams';

interface CompanyRegistrationData {
  name: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
}

export async function registerCompany(data: CompanyRegistrationData) {
  try {
    const { databases } = await adminAction();

    // Validate required fields
    if (!data.name || !data.contact_email) {
      return {
        success: false,
        message: 'Company name and contact email are required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contact_email)) {
      return {
        success: false,
        message: 'Invalid email address'
      };
    }

    // Generate unique company code
    const companyCode = await generateUniqueCompanyCode();

    // Create Appwrite team for the company
    const teamResult = await createInsuranceCompanyTeam(
      data.name,
      'temp-id' // Will be replaced with actual company ID
    );

    if (!teamResult.success || !teamResult.teamId) {
      return {
        success: false,
        message: 'Failed to create company team'
      };
    }

    // Create insurance company document
    const permissions = getInsuranceCompanyPermissions();
    const companyId = ID.unique();

    const company = await databases.createDocument<InsuranceCompanyDocument>(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      companyId,
      {
        name: data.name,
        company_code: companyCode,
        team_id: teamResult.teamId,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone ?? undefined,
        website: data.website ?? undefined,
        is_active: true,
      },
      permissions
    );

    // Send email with company code
    await sendCompanyCodeEmail(
      data.contact_email,
      data.name,
      companyCode
    );

    return {
      success: true,
      companyCode,
      message: `Registration successful! Company code sent to ${data.contact_email}`
    };

  } catch (error: any) {
    console.error('Company registration error:', error);

    if (error.code === 409) {
      return {
        success: false,
        message: 'A company with this information already exists'
      };
    }

    return {
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    };
  }
}
