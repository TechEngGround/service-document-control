import Logger from "../util/log"
import axios from "axios"
import { getJwt } from "../util/jwt"
import request from "request"

const gateway_url = process.env.GATEWAY_URL || "http://localhost:3000"
const app_url = process.env.APP_URL || "http://localhost"

const documentsEndpoint = gateway_url + "/docs/"
const sharepointEndpoint = app_url + "/sharepoint/"
const usersEndpoint = gateway_url + "/users/"
const loginEndpoint = gateway_url + "/login"

export async function saveOnDB(
  userId: string,
  filename: string,
  documentType: string,
  needSign: boolean,
): Promise<any> {
  try {
    const config = {
      headers: { Authorization: `Bearer ${getJwt()}` },
    }

    Logger.info(`Save Document ${filename} on DB for user ${userId}.`)
    const document = {
      type: documentType,
      path: filename,
      need_sign: needSign,
    }
    const documentsResponse = await axios.post(
      documentsEndpoint + "createdoc",
      { ...document },
      config,
    )
    Logger.info(`Document ${filename} saved! Updating user.`)

    await axios.post(
      usersEndpoint + `updateUserDocs`,
      { userId: userId, documentId: documentsResponse.data._id },
      config,
    )

    Logger.info(`User Updated!`)

    return { message: "Document Saved and User Updated!", error: undefined }
  } catch (error) {
    Logger.error(error)
    return { message: "Error", error }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function updateDocDB(
  d4sign_id: string,
  file: string,
  signers_info: Array<any>,
): Promise<any> {
  try {
    const data = {
      file: file,
      d4sign_id: d4sign_id,
      signers_info: signers_info,
    }

    Logger.info(`Updating Mongo Document ${file} on DB.`)

    await axios.post(documentsEndpoint + `findByNameAndUpdate`, data, {
      headers: { Authorization: `Bearer ${getJwt()}`, "Content-Type": "application/json" },
    })
    Logger.info(`Document ${file} updated.`)
  } catch (error) {
    Logger.error(error)
    return { message: "Error", error }
  }
}

export async function uploadToSharepoint(doc_info: any): Promise<any> {
  try {
    const options = {
      method: "POST",
      url: sharepointEndpoint + "uploadsignedfile",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(doc_info),
    }

    request(options, function (error, response) {
      if (error) {
        Logger.error(response.body)
        return response.body
      }
      Logger.info(`Document sent to sharepoint integrator.`)
      return response.body
    })
  } catch (error) {
    Logger.error(error)
    return { message: "Error", error }
  }
}

export async function updateDocSignStatus(update_info: any, operation: number): Promise<any> {
  try {
    let data
    let index

    const config = {
      headers: { Authorization: `Bearer ${getJwt()}` },
    }

    Logger.info(`Updating Mongo Document d4sign id > ${update_info.uuid} sign status on DB.`)

    const docFilter = { d4sign_id: update_info.uuid }
    const docResponse = await axios.post(
      documentsEndpoint + "getdocbyfilter",
      { filter: docFilter },
      config,
    )

    if (operation == 4) {
      const signers_info = docResponse.data[0].signers_info

      await signers_info.forEach(function (value: any) {
        if (value.email == update_info.email) {
          index = signers_info.indexOf(value)
          signers_info[index] = {
            email: value.email,
            key_signer: value.key_signer,
            signed: true,
            signed_ts: Date.now() / 1000,
            doc_uuid: value.doc_uuid,
          }
        }
      })

      data = {
        signers_info: signers_info,
      }
    } else if (operation == 1) {
      data = {
        sign_status: "finished",
        finished_ts: Date.now() / 1000,
      }
    } else if (operation == 3) {
      data = {
        sign_status: "cancelled",
      }
    } else if (operation == 2) {
      data = {
        sign_status: "email-not-sent",
      }
    }

    await axios.put(documentsEndpoint + `updatedoc/${docResponse.data[0]._id}`, data, {
      headers: { Authorization: `Bearer ${getJwt()}`, "Content-Type": "application/json" },
    })
    Logger.info(`Document d4sign id > ${update_info.uuid} sign status updated.`)
  } catch (error) {
    Logger.error(error)
    return { message: "Error", error }
  }
}

export async function login(email: string, password: string): Promise<any> {
  Logger.info("Making request to login...")
  const result = await axios.post(loginEndpoint, { email, password })

  Logger.info("Request done!")
  return result.data.last_token
}
