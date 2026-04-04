import { ActivationSnapshot, WidgetStatus, readActivationSnapshot } from '@/lib/activation-state';
import { buildLaunchReadiness, getRecommendedLaunchPack } from '@/lib/launch-pack';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeUrlInput } from '@/lib/validators';

type ActivationBusinessRecord = {
  id: string;
  name: string | null;
  industry: string | null;
  website: string | null;
  booking_url: string | null;
  google_review_link: string | null;
  services: unknown[] | null;
  knowledge_base: unknown[] | null;
  plan: string | null;
  active: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  settings: Record<string, unknown> | null;
};

type WidgetCheckResult = {
  widgetInstalled: boolean;
  widgetStatus: WidgetStatus;
  checkedAt: string;
};

const REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (compatible; ZypflowActivationBot/1.0; +https://zypflow.com)',
  accept: 'text/html,application/xhtml+xml',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSettings(settings: Record<string, unknown> | null) {
  return isRecord(settings) ? { ...settings } : {};
}

function normalizeList(value: unknown[] | null | undefined) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function isBillingReady(business: ActivationBusinessRecord) {
  if (business.active === false) return false;
  const plan = business.plan?.trim().toLowerCase();
  if (!plan || plan === 'trial' || plan === 'cancelled') {
    return false;
  }

  return Boolean(business.stripe_customer_id || business.stripe_subscription_id || plan);
}

function isOnboardingReady(business: ActivationBusinessRecord) {
  return Boolean(
    business.website &&
      business.booking_url &&
      business.google_review_link &&
      normalizeList(business.services).length > 0 &&
      normalizeList(business.knowledge_base).length > 0
  );
}

async function detectWidgetInstallation(website: string, orgId: string): Promise<WidgetCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(normalizeUrlInput(website), {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
    });

    const html = await response.text();
    const normalized = html.toLowerCase();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.zypflow.com').toLowerCase();
    const orgIdPattern = new RegExp(`data-org-id=["']${orgId}["']`, 'i');
    const detected =
      orgIdPattern.test(html) ||
      (normalized.includes('/v1.js') && normalized.includes(orgId.toLowerCase())) ||
      (normalized.includes(appUrl) && normalized.includes(orgId.toLowerCase()));

    return {
      widgetInstalled: detected,
      widgetStatus: detected ? 'verified' : 'missing',
      checkedAt,
    };
  } catch {
    return {
      widgetInstalled: false,
      widgetStatus: 'unreachable',
      checkedAt,
    };
  }
}

function buildAlerts(input: {
  billingReady: boolean;
  onboardingReady: boolean;
  widgetInstalled: boolean;
  widgetStatus: WidgetStatus;
  packDeployed: boolean;
  missingItems: string[];
  autoDeployError: string | null;
}) {
  const alerts: string[] = [];

  if (!input.billingReady) {
    alerts.push('Billing is not active yet, so launch automation is paused.');
  }

  if (!input.onboardingReady) {
    alerts.push(
      input.missingItems.length > 0
        ? `Complete the remaining setup items: ${input.missingItems.join(', ')}.`
        : 'The clinic setup is incomplete.'
    );
  }

  if (input.packDeployed && !input.widgetInstalled) {
    alerts.push(
      input.widgetStatus === 'unreachable'
        ? 'The widget could not be verified automatically. Confirm the script is installed on the clinic site.'
        : 'The widget still needs to be installed on the clinic website before the launch is live.'
    );
  }

  if (input.autoDeployError) {
    alerts.push('The core workflow could not be deployed automatically. Review template deployment before going live.');
  }

  return alerts.slice(0, 4);
}

export async function syncActivationForOrganisation(options: {
  orgId: string;
  confirmWidgetInstalled?: boolean;
  forceWidgetCheck?: boolean;
  persist?: boolean;
  allowAutoDeploy?: boolean;
}) {
  const persist = options.persist ?? true;
  const allowAutoDeploy = options.allowAutoDeploy ?? true;

  const { data: business, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select(
      'id, name, industry, website, booking_url, google_review_link, services, knowledge_base, plan, active, stripe_customer_id, stripe_subscription_id, settings'
    )
    .eq('id', options.orgId)
    .maybeSingle();

  if (businessError || !business) {
    throw new Error('Unable to load organisation for activation sync.');
  }

  const activationBusiness = business as ActivationBusinessRecord;
  const existingSnapshot = readActivationSnapshot(activationBusiness.settings);
  const { data: deployedTemplates } = await supabaseAdmin
    .from('deployed_templates')
    .select('template_id, is_active')
    .eq('org_id', options.orgId)
    .eq('is_active', true);

  const activeTemplateIds = new Set(
    (deployedTemplates || [])
      .filter((template) => template.is_active)
      .map((template) => template.template_id)
  );

  let widgetInstalled = existingSnapshot.widgetInstalled;
  let widgetStatus = existingSnapshot.widgetStatus;
  let widgetLastCheckedAt = existingSnapshot.widgetLastCheckedAt;

  if (options.confirmWidgetInstalled) {
    widgetInstalled = true;
    widgetStatus = 'confirmed';
    widgetLastCheckedAt = new Date().toISOString();
  }

  if (options.forceWidgetCheck && activationBusiness.website) {
    const widgetCheck = await detectWidgetInstallation(activationBusiness.website, activationBusiness.id);
    widgetLastCheckedAt = widgetCheck.checkedAt;

    if (widgetCheck.widgetInstalled) {
      widgetInstalled = true;
      widgetStatus = widgetCheck.widgetStatus;
    } else if (!widgetInstalled) {
      widgetInstalled = false;
      widgetStatus = widgetCheck.widgetStatus;
    }
  }

  const recommendedPack = getRecommendedLaunchPack(activationBusiness.industry);
  const billingReady = isBillingReady(activationBusiness);
  const onboardingReady = isOnboardingReady(activationBusiness);
  let autoDeployError: string | null = null;
  let autoDeployed = existingSnapshot.autoDeployed;
  let lastAutoDeployedAt = existingSnapshot.lastAutoDeployedAt;

  if (
    allowAutoDeploy &&
    billingReady &&
    onboardingReady &&
    !recommendedPack.templateIds.every((templateId) => activeTemplateIds.has(templateId))
  ) {
    const deployedAt = new Date().toISOString();
    const upsertRows = recommendedPack.templateIds.map((templateId) => ({
      org_id: activationBusiness.id,
      template_id: templateId,
      is_active: true,
      config: {},
      deployed_at: deployedAt,
    }));

    const { error } = await supabaseAdmin
      .from('deployed_templates')
      .upsert(upsertRows, { onConflict: 'org_id,template_id' });

    if (error) {
      autoDeployError = error.message;
    } else {
      autoDeployed = true;
      lastAutoDeployedAt = deployedAt;
      recommendedPack.templateIds.forEach((templateId) => activeTemplateIds.add(templateId));
    }
  }

  const readiness = buildLaunchReadiness({
    industry: activationBusiness.industry,
    website: activationBusiness.website,
    bookingUrl: activationBusiness.booking_url,
    reviewLink: activationBusiness.google_review_link,
    services: activationBusiness.services,
    knowledgeBase: activationBusiness.knowledge_base,
    activeTemplateIds,
    widgetInstalled,
  });

  const packDeployed = recommendedPack.templateIds.every((templateId) => activeTemplateIds.has(templateId));
  const alerts = buildAlerts({
    billingReady,
    onboardingReady,
    widgetInstalled,
    widgetStatus,
    packDeployed,
    missingItems: readiness.missingItems,
    autoDeployError,
  });

  const nowIso = new Date().toISOString();
  const status: ActivationSnapshot['status'] = autoDeployError
    ? 'attention'
    : !billingReady
      ? 'awaiting_payment'
      : !onboardingReady
        ? 'collecting_details'
        : !packDeployed
          ? 'attention'
          : !widgetInstalled
            ? 'ready_to_launch'
            : readiness.status === 'launch_ready'
              ? 'live'
              : 'attention';

  const snapshot: ActivationSnapshot = {
    status,
    billingReady,
    onboardingReady,
    widgetInstalled,
    widgetStatus,
    packId: recommendedPack.id,
    packName: recommendedPack.name,
    packDeployed,
    autoDeployed,
    score: readiness.score,
    missingItems: readiness.missingItems,
    alerts,
    lastSyncedAt: nowIso,
    widgetLastCheckedAt,
    lastAutoDeployedAt,
    launchReadyAt:
      status === 'live'
        ? existingSnapshot.launchReadyAt || nowIso
        : existingSnapshot.launchReadyAt,
  };

  if (persist) {
    const settings = normalizeSettings(activationBusiness.settings);
    settings.activation = snapshot;

    const { error } = await supabaseAdmin
      .from('businesses')
      .update({ settings })
      .eq('id', activationBusiness.id);

    if (error) {
      throw new Error('Unable to persist activation state.');
    }
  }

  return {
    business: activationBusiness,
    activation: snapshot,
    launchReadiness: readiness,
    autoDeployError,
  };
}
