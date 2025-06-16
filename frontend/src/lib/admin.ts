/**
 * Admin utilities for the frontend.
 */

import { User } from '@supabase/supabase-js';

// List of admin email addresses
const ADMIN_EMAILS = [
  'rathiharivansh@gmail.com',
  'andrew@thnkrai.com',
];

/**
 * Check if a user is an admin based on their email address.
 */
export function isAdminUser(user: User | null): boolean {
  if (!user?.email) {
    return false;
  }
  
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Check if an email address belongs to an admin user.
 */
export function isAdminEmail(email: string): boolean {
  if (!email) {
    return false;
  }
  
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
