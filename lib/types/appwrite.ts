import { Models, Account, Databases, Storage } from 'node-appwrite';

/**
 * Appwrite Document Type Definitions
 * Extends Models.Document to provide type-safe access to collection documents
 */

// Users Collection
export interface UserDocument extends Models.Document {
  full_name: string;
  email: string;
  role: 'facility_admin' | 'specialist' | 'patient';
  onboarding_completed: boolean;
  facility_id?: string;
  specialist_id?: string;
  patient_id?: string;
}

// Facilities Collection
export interface FacilityDocument extends Models.Document {
  name: string;
  facility_type: 'rehabilitation_center' | 'polyclinic' | 'hospital' | 'private_clinic';
  street: string;
  city: string;
  postal_code: string;
  admin_id: string;
  code: string;
  company_code?: string;
  vat_code?: string;
  medical_facility_code?: string;
  specializations?: string[];
  phone?: string;
  email?: string;
  website?: string;
  start_hour?: string;
  end_hour?: string;
  logo_file_id?: string;
  logo_url?: string;
}

// Specialists Collection
export interface SpecialistDocument extends Models.Document {
  facility_id: string;
  user_id: string;
  name: string;
  profession: string;
  work_duration: number;
  rest_duration: number;
  start_hour: string;
  end_hour: string;
  profile_picture_file_id?: string;
  profile_picture_url?: string;
}

// Patients Collection
export interface PatientDocument extends Models.Document {
  facility_id: string;
  full_name: string;
  personal_code?: string; // Encrypted
  assigned_specialist_id?: string;
  phone?: string;
  payment_type: 'paid' | 'vlk';
}

// Appointments Collection
export interface AppointmentDocument extends Models.Document {
  patient_id: string;
  specialist_id: string;
  start_time: string; // DateTime
  end_time: string; // DateTime
  status: 'planned' | 'done' | 'no_show';
  payment_type: 'paid' | 'vlk';
}

// Invitations Collection
export interface InvitationDocument extends Models.Document {
  token: string;
  facility_id: string;
  invited_by_user_id: string;
  invitee_email?: string | null;
  role: 'specialist' | 'patient';
  expires_at: string; // DateTime
  used: boolean;
  max_uses?: number | null;
  use_count: number;
  used_by_user_ids: string[];
  used_by_user_id?: string;
  used_at?: string; // DateTime
}

/**
 * Client Action Types
 * Used for type-safe returns from adminOrClient.ts
 */

export interface AppwriteClient {
  account: Account;
  databases: Databases;
  storage: Storage;
}

export interface ErrorResult {
  success: false;
  message: string;
}

/**
 * Type guard for clientAction results
 * Checks if the result is a successful AppwriteClient or an error
 *
 * @example
 * const result = await clientAction();
 * if (isAppwriteClient(result)) {
 *   const user = await result.account.get();
 * } else {
 *   console.error(result.message);
 * }
 */
export function isAppwriteClient(
  result: AppwriteClient | ErrorResult
): result is AppwriteClient {
  return !('success' in result);
}

/**
 * Type guard for AppwriteException errors
 * Use this to check if an error is from Appwrite and access error properties safely
 *
 * @example
 * try {
 *   await operation();
 * } catch (error: unknown) {
 *   if (isAppwriteError(error)) {
 *     console.log(error.code, error.type, error.message);
 *   }
 * }
 */
export interface AppwriteError {
  code: number;
  type: string;
  message: string;
  response?: unknown;
}

export function isAppwriteError(error: unknown): error is AppwriteError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'type' in error &&
    'message' in error &&
    typeof (error as AppwriteError).code === 'number' &&
    typeof (error as AppwriteError).type === 'string' &&
    typeof (error as AppwriteError).message === 'string'
  );
}
