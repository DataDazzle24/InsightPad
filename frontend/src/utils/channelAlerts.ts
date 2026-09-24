export type ChannelAlertIdentity = {
  id: string;
  version: number;
  alertKind: string;
};

export function selectCurrentChannelAlert<T extends ChannelAlertIdentity>(current: T | null, pending: T[]): T | null {
  if (!current) return pending[0] ?? null;
  return pending.find((candidate) => (
    candidate.id === current.id
    && candidate.version === current.version
    && candidate.alertKind === current.alertKind
  )) ?? pending[0] ?? null;
}
