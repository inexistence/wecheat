export const wait = async function (million: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, million)
  })
}

export const pgv_y = function (d?: string): string {
  return (d || "") + Math.round(2147483647 * (Math.random() || 0.5)) * +new Date % 1E10
}

export const pgv_d = function (): number {
  return (Math.round(Math.random() * 2147483647) * (new Date().getUTCMilliseconds())) % 10000000000;
}

export const pgv_pvi = function (): string {
  return pgv_y()
}

export const pgv_si = function (): string {
  return pgv_y("s")
}
type PGV = {
  pgv_pvi: string
  pgv_si: string
}
export const pgv = function (): PGV {
  const d = pgv_d()
  return {
    pgv_pvi: pgv_y(),
    pgv_si: pgv_y('s')
  }
}

export const json2Cookie = function (json: any): string[] {
  let cookies = []
  for (const key in json) {
    cookies.push(`${key}=${json[key]}; `)
  }
  return cookies
}
