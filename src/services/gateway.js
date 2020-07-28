const Logger = require('../util/log')
const axios = require('axios')

const documentsEndpoint = process.env.GATEWAY_URL + '/documents/'
const usersEndpoint = process.env.GATEWAY_URL + '/users/'

exports.saveOnDB = async (userId, filename, documentType) => {
  try {
    Logger.info(`Save Document ${filename} on DB for user ${userId}.`)
    const document = {
      type: documentType,
      path: filename,
    }
    const documentsResponse = await axios.post(documentsEndpoint + 'createdoc', { ...document })
    Logger.info(`Document ${filename} saved! Updating user.`)

    const userFilter = { _id: userId }
    const userResponse = await axios.post(usersEndpoint + 'getuserbyfilter', { filter: userFilter })

    userResponse.documents.push(documentsResponse)
    await axios.put(usersEndpoint + 'updateuser/' + userId, { documents: userResponse.documents})
    Logger.info(`User Updated!`)

    return { message: 'Document Saved and User Updated!', error: undefined }
  } catch (error) {
    Logger.error(error)
    return { message: undefined, error }
  }
}