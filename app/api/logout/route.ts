import { LogoutUser } from '@/appwrite/logOut';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await LogoutUser();
    return NextResponse.redirect(
      new URL('/', process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, redirect to homepage
    return NextResponse.redirect(
      new URL('/', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
