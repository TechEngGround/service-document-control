import axios, {AxiosRequestConfig} from 'axios'
import { updateDocDB } from "../services/gateway"
import Express from "express";
import fs from 'fs'
import request from 'request-promise'
import Logger from '../util/log';
import MinioConnector from "../services/minio";

const endpoint = process.env.D4SIGN_URL||'http://demo.d4sign.com.br/api/v1'
const tokenapi = process.env.D4SIGN_TOKENAPI || 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1'
const cryptKey = process.env.D4SIGN_CRYPTKEY||'live_crypt_t9ZpxRzAxOVFQOVaVhz0LDKTEHpUEHTW'
const safeUUID = process.env.D4SIGN_SAFEUUID||'f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0'
const minioUserID = process.env.MINIO_USERID || ''
const filespath = './downloads/'

async function sendDoc(filename: string): Promise<any>{
  
  Logger.info(`Sending file ${filename} to d4sign API...`);
  const content = fs.createReadStream(filespath + filename)
  let uuid

  let uploadoptions = {
    method: 'POST',
    url: `${endpoint}/documents/${safeUUID}/upload`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'content-type': 'multipart/form-data'},
    formData: {
      'file': {
        'value': content,
        'options': {
          'filename': filename,
          'contentType': null
        }
      },
      tokenAPI: tokenapi,
    },
    json: true
  }

  await request(uploadoptions, function (error, response){
    if (error){
      Logger.error(`Error during file upload to d4sign...`);
      return error
    }
    uuid = response.body.uuid
    Logger.info(`File ${filename} successfully uploaded to d4sign API with uuid ${uuid} ...`);
  })

  return uuid

 }

async function registerSigners(signerdoc: any, file_uuid: string):Promise<any>{
  
  Logger.info(`Sending file uuid ${file_uuid} signers information to d4sign API...`);
  let signerresponse
    
  let signeroptions = {
    method: 'POST',
    url: `${endpoint}/documents/${file_uuid}/createlist`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'Content-Type': 'application/json',
              'Accept': 'application/json'},
    body: signerdoc,
    json: true
  }

  await request(signeroptions, function (error, response){
    if (error){
      Logger.error(`Error while sending signers information to d4sign API...`);
      return error
    }
    Logger.info(`Signers information for file ${file_uuid} successfully posted to d4sign API...`);
    signerresponse = response.body
  })
  
  return signerresponse

 }

 async function sendtoSigner(signers: string, docuuid: string):Promise<any>{
  
  Logger.info(`Sending document ${docuuid} to users ${signers}...`);
  let mailbody = {
    "message": `Assinatura do documento uuid ${docuuid}`,
    "skip_email": "0",
    "workflow": "0",
    "tokenAPI": tokenapi
  }
  let mailresponse
    
  let mailoptions = {
    method: 'POST',
    url: `${endpoint}/documents/${docuuid}/sendtosigner`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'Content-Type': 'application/json',
              'Accept': 'application/json'},
    body: mailbody,
    json: true
  }

  await request(mailoptions, function (error, response){
    if (error){
      Logger.error(`Error while sending documento to user(s) ${signers} to sign...`);
      return error
    }
    Logger.info(`Document ${docuuid} successfully sent to user(s) ${signers}...`);
    mailresponse = response.body
  })
  
  return mailresponse

 }

async function getSafes(req: Express.Request, res: Express.Response) {
  
  const safeconfig: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  const safesResponse = await axios.get(
    `${endpoint}/safes?tokenAPI=${tokenapi}&cryptKey=${cryptKey}`,
    safeconfig
    );
    res.status(200).send(safesResponse.data[0]);
    return;
  }

export async function resendSignLink(req: Express.Request, res: Express.Response) {
  
  const resendconfig: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      "email": req.body.email,
      "key_signer": req.body.key_signer
    }
  }
  
  const resendResponse = await axios.post(
    `${endpoint}/documents/${req.body.doc_uuid}/resend?tokenAPI=${tokenapi}&cryptKey=${cryptKey}`,
    resendconfig
    );
    res.status(200).send(resendResponse.data[0]);
    return;
  }

export async function d4signflow(req: Express.Request, res: Express.Response) {
     
  let presencial: string
  let signers_str: string = ''
  let signers: Array<object> = []
  let signers_emails_db: Array<string> = []
  let signers_keys_db: Array<string> = []
  let signers_confirmation: Array<object> = []

  if (!req.body.presencial || req.body.presencial === false) {
    presencial = "0"
  }else{
    presencial = "1"
  }

  try{
    Logger.info(`Downloading file ${req.body.file} to downloads folder...`);
    const minioClient = new MinioConnector();
    await minioClient.downloadObject(
      req.body.file,
      minioUserID,
      res
    );
    Logger.info(`File ${req.body.file} successfully downloaded to downloads folder...`);
  }catch{
    Logger.error("Error when downloading the file to downloads folder!");
  }
  
  if (!fs.existsSync(filespath + req.body.file)) {
    Logger.error("File not found on downloads path!");
    return res.status(500).send({"error":"file not found!"});
  }

  const docuuid = await sendDoc(req.body.file)
  
  await req.body.signers.forEach(function (value: string) {
    signers.push({"email": value,
    "act": "1",
    "foreign": "0",
    "certificadoicpbr": "0",
    "assinatura_presencial": presencial,
    "embed_methodauth": "email"
    })
    signers_str = signers_str + ' / ' + value
  })

  const signerdoc = {"signers" : signers}

  const signerresponse = await registerSigners(signerdoc, docuuid)
  await sendtoSigner(signers_str, docuuid)

  await signerresponse.message.forEach(function (value: any) {
    signers_confirmation.push({
      "status":"success",
      "email": value.email,
      "key_signer": value.key_signer,
      "safe_uuid":safeUUID,
      "doc_uuid":docuuid
    })
    signers_emails_db.push(value.email),
    signers_keys_db.push(value.key_signer)
  })

  await updateDocDB(req.body.mongo_id, docuuid, req.body.file, signers_keys_db, signers_emails_db)

  try {
    Logger.info(`Removing file ${req.body.file} from downloads folder...`)
    //fs.unlinkSync(filespath + req.body.file)
    Logger.info(`File ${req.body.file} successfully removed from downloads folder...`)
  } catch(err) {
    Logger.error(`Error while removing file from downloads folder: ${err.toString()}`);
  }

  return res.status(200).send(signers_confirmation)

}