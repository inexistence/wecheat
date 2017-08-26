export async function wait(million: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, million);
  });
}

export function pgv_y(d?: string): string {
  return (d || "") + Math.round(2147483647 * (Math.random() || 0.5)) * +new Date % 1E10;
}

export function pgv_d(): number {
  return (Math.round(Math.random() * 2147483647) * (new Date().getUTCMilliseconds())) % 10000000000;
}

export function pgv_pvi(): string {
  return pgv_y();
}

export function pgv_si(): string {
  return pgv_y("s");
}
type PGV = {
  pgv_pvi: string;
  pgv_si: string;
};
export function pgv(): PGV {
  const d = pgv_d();
  return {
    pgv_pvi: pgv_y(),
    pgv_si: pgv_y('s')
  };
}

export function synckey2Str(syncKey: SyncKey) {
  return syncKey.List.reduce((last: string, item: {Key: number, Val: number}): string => {
    return `${last}${last ? '|': ''}${item.Key}_${item.Val}`;
  }, '');
}

export function second() {
  return Math.floor((new Date().getTime()) / 1000)
}

export function millionSecond() {
  return new Date().getTime()
}
