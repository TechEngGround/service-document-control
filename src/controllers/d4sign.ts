// import axios, { AxiosRequestConfig } from 'axios'
import { updateDocDB, updateDocSignStatus, uploadToSharepoint } from "../services/gateway"
import Express from "express"
import fs from "fs"
import request from "request-promise"
import Logger from "../util/log"
import MinioConnector from "../services/minio"

const endpoint = process.env.D4SIGN_URL || "https://secure.d4sign.com.br/api/v1"
const tokenapi =
  process.env.D4SIGN_TOKENAPI ||
  "live_e74b28ff181cb4a36c4cf0a1b334c9b7205ce934fa108453b2acba9a6707daee"
const cryptKey = process.env.D4SIGN_CRYPTKEY || "live_crypt_p0wj4wIZbaX0F79N13luTVdWSea8bQjh"
const safeUUID = process.env.D4SIGN_SAFEUUID || "f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0"
const callback_url = process.env.CALLBACK_URL || "https://mytestd4sign.requestcatcher.com/test"
// const minioUserID = process.env.MINIO_USERID || ''
const filespath = "./downloads/"

async function sendDoc(filename: string): Promise<any> {
  Logger.info(`Sending file ${filename} to d4sign API...`)
  const content = fs.createReadStream(filespath + filename)
  let uuid

  const uploadoptions = {
    method: "POST",
    url: `${endpoint}/documents/${safeUUID}/upload`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "content-type": "multipart/form-data" },
    formData: {
      file: {
        value: content,
        options: {
          filename: filename,
          contentType: null,
        },
      },
      tokenAPI: tokenapi,
    },
    json: true,
  }

  await request(uploadoptions, function (error, response) {
    if (response.statusCode != 200) {
      Logger.error(`Error during file upload to d4sign...>> ${response.body.message}`)
      return "-1"
    }
    uuid = response.body.uuid
    Logger.info(`File ${filename} successfully uploaded to d4sign API with uuid ${uuid} ...`)
  })

  return uuid
}

async function registerSigners(signerdoc: any, file_uuid: string): Promise<any> {
  Logger.info(`Sending file uuid ${file_uuid} signers information to d4sign API...`)
  let signerresponse

  const signeroptions = {
    method: "POST",
    url: `${endpoint}/documents/${file_uuid}/createlist`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: signerdoc,
    json: true,
  }

  await request(signeroptions, function (error, response) {
    if (error) {
      Logger.error(`Error while sending signers information to d4sign API...`)
      return error
    }
    Logger.info(`Signers information for file ${file_uuid} successfully posted to d4sign API...`)
    signerresponse = response.body
  })

  return signerresponse
}

async function sendtoSigner(signers: string, docuuid: string): Promise<any> {
  Logger.info(`Sending document ${docuuid} to users ${signers}...`)
  const mailbody = {
    skip_email: 1,
    workflow: "0",
    tokenAPI: tokenapi,
  }
  let mailresponse

  const mailoptions = {
    method: "POST",
    url: `${endpoint}/documents/${docuuid}/sendtosigner`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: mailbody,
    json: true,
  }

  await request(mailoptions, function (error, response) {
    if (error) {
      Logger.error(`Error while sending document to user(s) ${signers} to sign...`)
      return error
    }
    Logger.info(`Document ${docuuid} successfully sent to user(s) ${signers}...`)
    mailresponse = response.body
  })

  return mailresponse
}

/* async function getSafes(req: Express.Request, res: Express.Response) {
  const safeconfig: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const safesResponse = await axios.get(
    `${endpoint}/safes?tokenAPI=${tokenapi}&cryptKey=${cryptKey}`,
    safeconfig,
  )
  res.status(200).send(safesResponse.data[0])
  return
} */

async function registerCallback(docuuid: string): Promise<void> {
  let callback_response

  const callbackoptions = {
    method: "POST",
    url: `${endpoint}/documents/${docuuid}/webhooks`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: {
      url: callback_url,
    },
    json: true,
  }

  await request(callbackoptions, function (error, response) {
    if (error) {
      Logger.error(`Error while registering callback URL < ${callback_url} > to doc ${docuuid}...`)
      return error
    }
    Logger.info(`Document ${docuuid} callback url < ${callback_url} > successfully created...`)
    callback_response = response.body
  })

  return callback_response
}

export async function resendSignLink(req: Express.Request, res: Express.Response) {
  const data = {
    email: req.body.email,
    key_signer: req.body.key_signer,
  }

  const resendlinkoptions = {
    method: "POST",
    url: `${endpoint}/documents/${req.body.doc_uuid}/resend`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: data,
    json: true,
  }
  try {
    await request(resendlinkoptions, function (error, response) {
      if (error) {
        Logger.error(`Error while sending documento to user(s) ${req.body.email} to sign...`)
        return res.status(500).send(error)
      }
      Logger.info(`Request to re-sent sign link to ${req.body.email} successfully ...`)
      res.status(response.statusCode).send(response.body)
    })
  } catch (err) {
    Logger.error(`Error in request to re-sent sign link to ${req.body.email}: ${err}...`)
    return
  }
}

export async function downloadDoc(req: Express.Request, res: Express.Response) {
  Logger.info(`Request download received for document uuid ${req.body.doc_uuid} ...`)

  const downloadoptions = {
    method: "POST",
    url: `${endpoint}/documents/${req.body.doc_uuid}/download`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey,
    },
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    json: true,
  }

  try {
    await request(downloadoptions, function (error, response) {
      if (error) {
        Logger.error(`Error while downloading document uuid ${req.body.doc_uuid} ...`)
        return res.status(500).send(error)
      }
      Logger.info(`Document uuid ${req.body.doc_uuid} successfully downloaded ...`)
      res.status(response.statusCode).send(response.body)
    })
  } catch (err) {
    Logger.error(`Error in download request to doc ${req.body.uuid}: ${err}...`)
    return
  }
}

export async function updateDocStatus(req: Express.Request, res: Express.Response) {
  try {
    Logger.info(`Callback received for document ${req.body.uuid}...`)

    await updateDocSignStatus(req.body, parseInt(req.body.type_post))

    if (parseInt(req.body.type_post) == 1) {
      const downloadoptions = {
        method: "POST",
        url: `${endpoint}/documents/${req.body.uuid}/download`,
        qs: {
          tokenAPI: tokenapi,
          cryptKey: cryptKey,
        },
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: { type: "pdf", language: "pt" },
        json: true,
      }

      const docOptions = {
        method: "GET",
        url: `${endpoint}/documents/${req.body.uuid}`,
        qs: {
          tokenAPI: tokenapi,
          cryptKey: cryptKey,
        },
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        json: true,
      }

      try {
        const link = await request(downloadoptions, function (error, response) {
          if (error) {
            Logger.error(`Error while downloading document uuid ${req.body.doc_uuid} ...`)
            return { error: error }
          }
          Logger.info(`Document uuid ${req.body.uuid} successfully get link ...`)
          return response.body
        })

        const info = await request(docOptions, function (error, response) {
          if (error) {
            Logger.error(`Error while downloading document uuid ${req.body.doc_uuid} ...`)
            return { error: error }
          }
          Logger.info(`Document uuid ${req.body.uuid} informations obtained ...`)
          return response.body
        })

        const doc_info = {
          d4signURL: link.url,
          filename: info[0].nameDoc,
          foldername: "PORTAL BCA",
        }

        await uploadToSharepoint(doc_info)
      } catch (err) {
        Logger.error(`Error in download request to doc ${req.body.uuid}: ${err}...`)
        return
      }
    }
    return res.status(200).send({ message: "Ok" })
  } catch (err) {
    Logger.error(
      `Error whein receiving callback for document ${req.body.uuid} > ${err.toString()}...`,
    )
    return res.status(500).send({ error: err })
  }
}

export async function d4signflow(req: Express.Request, res: Express.Response) {
  let presencial: string
  let signers_str = ""
  // eslint-disable-next-line @typescript-eslint/ban-types
  const signers: Array<object> = []
  // eslint-disable-next-line @typescript-eslint/ban-types
  const signers_info: Array<Object> = []
  // eslint-disable-next-line @typescript-eslint/ban-types
  const signers_confirmation: Array<object> = []
  let docuuid: string

  if (!req.body.presencial || req.body.presencial === false) {
    presencial = "0"
  } else {
    presencial = "1"
  }

  try {
    Logger.info(`Downloading file ${req.body.file} to downloads folder...`)
    const minioClient = new MinioConnector()
    await minioClient.downloadObjectSync(req.body.file)
    Logger.info(`File ${req.body.file} successfully downloaded to downloads folder...`)
  } catch {
    Logger.error("Error while downloading the file to downloads folder!")
  }

  if (!fs.existsSync(filespath + req.body.file)) {
    Logger.error("File not found on downloads path!")
    return res.status(500).send({ error: "file not found!" })
  }

  try {
    docuuid = await sendDoc(req.body.file)
  } catch (error) {
    res.status(500).send({ error: "Error on file upload to d4sign... cancelling " })
    return error
  }

  await req.body.signers.forEach(function (value: string) {
    signers.push({
      email: value,
      act: "1",
      foreign: "0",
      certificadoicpbr: "0",
      assinatura_presencial: presencial,
      embed_methodauth: "password",
    })
    signers_str = signers_str + " / " + value
  })

  const signerdoc = { signers: signers }

  const signerresponse = await registerSigners(signerdoc, docuuid)
  await sendtoSigner(signers_str, docuuid)
  await registerCallback(docuuid)

  await signerresponse.message.forEach(function (value: any) {
    signers_info.push({
      email: value.email,
      key_signer: value.key_signer,
      signed: false,
      doc_uuid: docuuid,
    })
  })

  await updateDocDB(docuuid, req.body.file, signers_info)

  try {
    Logger.info(`Removing file ${req.body.file} from downloads folder...`)
    // fs.unlinkSync(filespath + req.body.file)
    Logger.info(`File ${req.body.file} successfully removed from downloads folder...`)
  } catch (err) {
    Logger.error(`Error while removing file from downloads folder: ${err.toString()}`)
  }

  return res.status(200).send(signers_confirmation)
}
