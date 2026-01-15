"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID, Query } from 'node-appwrite';
import type { InsuranceCompanyDocument, UserDocument } from '@/lib/types/appwrite';
import { getUserPermissions } from '@/lib/permissions';

interface OnboardingData {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'insurance_adjuster';
  company_code: string | null;
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    const { databases, teams } = await adminAction();

    let insuranceCompanyId: string | undefined;
    let teamId: string | undefined;

    // If insurance adjuster, validate company code
    if (data.role === 'insurance_adjuster') {
      if (!data.company_code) {
        return { success: false, message: 'Company code is required for insurance employees' };
      }

      // Find insurance company by code
      const companiesResult = await databases.listDocuments<InsuranceCompanyDocument>(
        DATABASE_ID,
        COLLECTION_IDS.INSURANCE_COMPANIES,
        [Query.equal('company_code', data.company_code), Query.limit(1)]
      );

      if (companiesResult.documents.length === 0) {
        return {
          success: false,
          message: 'Invalid company code. Please check with your administrator.'
        };
      }

      const company = companiesResult.documents[0];

      if (!company.is_active) {
        return {
          success: false,
          message: 'This insurance company is not currently active.'
        };
      }

      insuranceCompanyId = company.$id;
      teamId = company.team_id;

      // Add user to company team if team exists
      if (teamId) {
        try {
          await teams.createMembership(
            teamId,
            ['adjuster'], // Team role
            undefined, // URL (optional)
            data.userId
          );
        } catch (error: any) {
          // User may already be a member, that's okay
          if (error.code !== 409) {
            console.warn('Failed to add user to team:', error);
          }
        }
      }
    }

    // Create UserDocument with proper permissions
    const permissions = getUserPermissions(data.userId);

    await databases.createDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      data.userId, // Use Appwrite account ID as document ID
      {
        full_name: data.name,
        email: data.email,
        role: data.role,
        insurance_company_id: insuranceCompanyId,
        onboarding_completed: true,
      },
      permissions
    );

    return { success: true };
  } catch (error: any) {
    console.error('Onboarding error:', error);

    if (error.code === 409) {
      return { success: false, message: 'User account already exists' };
    }

    return {
      success: false,
      message: error.message || 'Failed to complete onboarding. Please try again.'
    };
  }
}
