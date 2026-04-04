export type ActivationStatus =
  | 'collecting_details'
  | 'awaiting_payment'
  | 'ready_to_launch'
  | 'live'
  | 'attention';

export type WidgetStatus = 'unchecked' | 'confirmed' | 'verified' | 'missing' | 'unreachable';

export interface ActivationSnapshot {
  status: ActivationStatus;
  billingReady: boolean;
  onboardingReady: boolean;
  widgetInstalled: boolean;
  widgetStatus: WidgetStatus;
  packId: string | null;
  packName: string | null;
  packDeployed: boolean;
  autoDeployed: boolean;
  score: number;
  missingItems: string[];
  alerts: string[];
  lastSyncedAt: string | null;
  widgetLastCheckedAt: string | null;
  lastAutoDeployedAt: string | null;
  launchReadyAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function defaultActivationSnapshot(): ActivationSnapshot {
  return {
    status: 'collecting_details',
    billingReady: false,
    onboardingReady: false,
    widgetInstalled: false,
    widgetStatus: 'unchecked',
    packId: null,
    packName: null,
    packDeployed: false,
    autoDeployed: false,
    score: 0,
    missingItems: [],
    alerts: [],
    lastSyncedAt: null,
    widgetLastCheckedAt: null,
    lastAutoDeployedAt: null,
    launchReadyAt: null,
  };
}

export function readActivationSnapshot(settings?: Record<string, unknown> | null): ActivationSnapshot {
  const fallback = defaultActivationSnapshot();
  if (!isRecord(settings)) {
    return fallback;
  }

  const activation = settings.activation;
  if (!isRecord(activation)) {
    return fallback;
  }

  const status = activation.status;
  const widgetStatus = activation.widgetStatus;

  return {
    status:
      status === 'collecting_details' ||
      status === 'awaiting_payment' ||
      status === 'ready_to_launch' ||
      status === 'live' ||
      status === 'attention'
        ? status
        : fallback.status,
    billingReady: Boolean(activation.billingReady),
    onboardingReady: Boolean(activation.onboardingReady),
    widgetInstalled: Boolean(activation.widgetInstalled),
    widgetStatus:
      widgetStatus === 'unchecked' ||
      widgetStatus === 'confirmed' ||
      widgetStatus === 'verified' ||
      widgetStatus === 'missing' ||
      widgetStatus === 'unreachable'
        ? widgetStatus
        : fallback.widgetStatus,
    packId: typeof activation.packId === 'string' ? activation.packId : null,
    packName: typeof activation.packName === 'string' ? activation.packName : null,
    packDeployed: Boolean(activation.packDeployed),
    autoDeployed: Boolean(activation.autoDeployed),
    score: typeof activation.score === 'number' ? activation.score : fallback.score,
    missingItems: Array.isArray(activation.missingItems)
      ? activation.missingItems.filter((item): item is string => typeof item === 'string')
      : [],
    alerts: Array.isArray(activation.alerts)
      ? activation.alerts.filter((item): item is string => typeof item === 'string')
      : [],
    lastSyncedAt: typeof activation.lastSyncedAt === 'string' ? activation.lastSyncedAt : null,
    widgetLastCheckedAt: typeof activation.widgetLastCheckedAt === 'string' ? activation.widgetLastCheckedAt : null,
    lastAutoDeployedAt: typeof activation.lastAutoDeployedAt === 'string' ? activation.lastAutoDeployedAt : null,
    launchReadyAt: typeof activation.launchReadyAt === 'string' ? activation.launchReadyAt : null,
  };
}

export function formatActivationStatus(status: ActivationStatus) {
  return status.replace(/_/g, ' ');
}

export function getActivationTone(status: ActivationStatus) {
  if (status === 'live') return 'healthy';
  if (status === 'ready_to_launch') return 'watch';
  return status === 'attention' ? 'risk' : 'watch';
}
