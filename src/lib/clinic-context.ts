import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export type ClinicContext = {
  clinicid: number;
  name: string;
  slug: string;
  plan: string;
  logo: string;
  primaryColor: string;
  city: string;
};

/**
 * Returns a ClinicContext from the DB by its slug, or null if not found.
 */
export async function getClinicFromSlug(slug: string): Promise<ClinicContext | null> {
  const clinic = await db.clinic.findUnique({
    where: { slug },
  });

  if (!clinic) return null;

  return {
    clinicid: clinic.clinicid,
    name: clinic.name,
    slug: clinic.slug,
    plan: clinic.plan,
    logo: clinic.logo,
    primaryColor: clinic.primaryColor,
    city: clinic.city,
  };
}

/**
 * Extracts the clinic slug from the request and returns the ClinicContext.
 *
 * Resolution order:
 *  1. If host is localhost / 127.0.0.1 → check ?clinic= query param
 *  2. If host starts with a known slug (e.g. "falaha.localhost") → extract first subdomain as slug
 *  3. Otherwise → return null (main portal / super admin)
 */
export async function getClinicFromRequest(req: NextRequest): Promise<ClinicContext | null> {
  const host = req.headers.get('host') || '';

  // Strip port if present
  const hostname = host.split(':')[0];

  // Local development: use ?clinic= query param
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const clinicSlug = req.nextUrl.searchParams.get('clinic');
    if (clinicSlug) {
      return getClinicFromSlug(clinicSlug);
    }
    return null;
  }

  // Subdomain-based: extract first part of hostname
  // e.g. "falaha.docteresa.com" → slug = "falaha"
  //      "falaha.localhost:3000"  → slug = "falaha"
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const possibleSlug = parts[0];
    // Avoid matching bare "www" or the apex domain itself
    if (possibleSlug && possibleSlug !== 'www' && possibleSlug !== hostname) {
      return getClinicFromSlug(possibleSlug);
    }
  }

  return null;
}
