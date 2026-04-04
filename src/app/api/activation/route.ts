import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { syncActivationForOrganisation } from '@/lib/activation-engine';
import { resolveRequestOrgAccess } from '@/lib/server-org-access';

const activationSyncSchema = z.object({
  confirmWidgetInstalled: z.boolean().optional(),
  forceWidgetCheck: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const access = await resolveRequestOrgAccess(req, { minimumRole: 'member' });
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const result = await syncActivationForOrganisation({
      orgId: access.orgId,
      persist: false,
      allowAutoDeploy: false,
    });

    return NextResponse.json({
      activation: result.activation,
      launchReadiness: {
        score: result.launchReadiness.score,
        status: result.launchReadiness.status,
        completedCount: result.launchReadiness.completedCount,
        totalCount: result.launchReadiness.totalCount,
        missingItems: result.launchReadiness.missingItems,
        packName: result.launchReadiness.pack.name,
      },
    });
  } catch (error) {
    console.error('Activation status fetch failed:', error);
    return NextResponse.json({ error: 'Unable to load activation status.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await resolveRequestOrgAccess(req, { minimumRole: 'member' });
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await req.json().catch(() => ({}));
  const parsed = activationSyncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid activation payload.' }, { status: 400 });
  }

  try {
    const result = await syncActivationForOrganisation({
      orgId: access.orgId,
      confirmWidgetInstalled: parsed.data.confirmWidgetInstalled,
      forceWidgetCheck: parsed.data.forceWidgetCheck,
    });

    return NextResponse.json({
      activation: result.activation,
      launchReadiness: {
        score: result.launchReadiness.score,
        status: result.launchReadiness.status,
        completedCount: result.launchReadiness.completedCount,
        totalCount: result.launchReadiness.totalCount,
        missingItems: result.launchReadiness.missingItems,
        packName: result.launchReadiness.pack.name,
      },
      autoDeployError: result.autoDeployError,
    });
  } catch (error) {
    console.error('Activation sync failed:', error);
    return NextResponse.json({ error: 'Unable to sync activation.' }, { status: 500 });
  }
}
