let _jwt = ''

export const endpointUser = {
  email: 'docadmin@admin',
  password: 'bca@2020',
}

export function setJwt(jwt: string) {
  _jwt = jwt
}

export function getJwt(): string {
  return _jwt
}