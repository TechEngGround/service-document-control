import axios, {AxiosRequestConfig} from 'axios'
import { updateDocDB, updateDocSignStatus } from "../services/gateway"
import Express from "express";
import fs from 'fs'
import request from 'request-promise'
import Logger from '../util/log';
import MinioConnector from "../services/minio";

const endpoint = process.env.D4SIGN_URL
const tokenapi = process.env.D4SIGN_TOKENAPI
const cryptKey = process.env.D4SIGN_CRYPTKEY
const safeUUID = process.env.D4SIGN_SAFEUUID
const callback_url = process.env.CALLBACK_URL
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
      Logger.error(`Error while sending document to user(s) ${signers} to sign...`);
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

async function registerCallback(docuuid: string):Promise<void>{

  let callback_response

  let callbackoptions = {
    method: 'POST',
    url: `${endpoint}/documents/${docuuid}/webhooks`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'Content-Type': 'application/json',
              'Accept': 'application/json'},
    body: {
      "url":callback_url
    },
    json: true
  }

  await request(callbackoptions, function (error, response){
    if (error){
      Logger.error(`Error while registering callback URL < ${callback_url} > to doc ${docuuid}...`);
      return error
    }
    Logger.info(`Document ${docuuid} callback url < ${callback_url} > successfully created...`);
    callback_response = response.body
  })

  return;

}

export async function resendSignLink(req: Express.Request, res: Express.Response) {
    
  const data = {
      "email": req.body.email,
      "key_signer": req.body.key_signer
  }
  
  let resendlinkoptions = {
    method: 'POST',
    url: `${endpoint}/documents/${req.body.doc_uuid}/resend`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'Content-Type': 'application/json',
              'Accept': 'application/json'},
    body: data,
    json: true
  }
  try{
  await request(resendlinkoptions, function (error, response){
    if (error){
      Logger.error(`Error while sending documento to user(s) ${req.body.email} to sign...`);
      return res.status(500).send(error)
    }
    Logger.info(`Request to re-sent sign link to ${req.body.email} successfully ...`);
    res.status(response.statusCode).send(response.body);
    })
    }catch (err){
    Logger.error(`Error in request to re-sent sign link to ${req.body.email}: ${err}...`)
    return;
  }  
}

export async function updateDocStatus(req: Express.Request, res: Express.Response){

  try{

      Logger.info(`Callback received for document ${req.body.uuid}...`)
      
      await updateDocSignStatus(req.body, parseInt(req.body.type_post))
      
      return res.status(200).send({"message":"Ok"})
  }catch(err){
    
    Logger.error(`Error whein receiving callback for document ${req.body.uuid} > ${err.toString()}...`)
    return res.status(500).send({"error":err})
  
  }

}

export async function downloadDoc(req: Express.Request, res: Express.Response) {
  
  Logger.info(`Request download received for document uuid ${req.body.doc_uuid} ...`);

  let downloadoptions = {
    method: 'POST',
    url: `${endpoint}/documents/${req.body.doc_uuid}/download`,
    qs: {
      tokenAPI: tokenapi,
      cryptKey: cryptKey
    },
    headers: {'Content-Type': 'application/json',
              'Accept': 'application/json'},
    json: true
  }

  try{
    await request(downloadoptions, function (error, response){
      if (error){
        Logger.error(`Error while downloading document uuid ${req.body.doc_uuid} ...`);
        return res.status(500).send(error)
      }
      Logger.info(`Document uuid ${req.body.doc_uuid} successfully downloaded ...`);
      res.status(response.statusCode).send(response.body);
      })
  }catch (err){
    Logger.error(`Error in download request to doc ${req.body.uuid}: ${err}...`)
    return;
  }  
}

export async function d4signflow(req: Express.Request, res: Express.Response) {
     
  let presencial: string
  let signers_str: string = ''
  let signers: Array<object> = []
  let signers_info: Array<Object> = []
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
    Logger.error("Error while downloading the file to downloads folder!");
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
  await registerCallback(docuuid)

  await signerresponse.message.forEach(function (value: any) {
    signers_info.push({
      "email": value.email,
      "key_signer": value.key_signer,
      "signed":false,
      "doc_uuid":docuuid
    })
  })

  await updateDocDB(docuuid, req.body.file, signers_info)

  try {
    Logger.info(`Removing file ${req.body.file} from downloads folder...`)
    //fs.unlinkSync(filespath + req.body.file)
    Logger.info(`File ${req.body.file} successfully removed from downloads folder...`)
  } catch(err) {
    Logger.error(`Error while removing file from downloads folder: ${err.toString()}`);
  }

  return res.status(200).send(signers_confirmation)

}