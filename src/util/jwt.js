let _jwt = ''

exports.endpointUser = {
  email: 'docadmin@admin',
  password: 'bca@2020',
}

exports.setJwt = (jwt) => {
  _jwt = jwt
}

exports.getJwt = () => {
  return _jwt
}