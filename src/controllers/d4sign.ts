import axios, {AxiosRequestConfig} from 'axios'
import Express from "express";
import fs from 'fs'
import request from 'request-promise'
import Logger from "../util/log";

const endpoint = process.env.D4SIGN_URL||'http://demo.d4sign.com.br/api/v1'
const tokenapi = process.env.D4SIGN_TOKENAPI || 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1'
const cryptKey = process.env.D4SIGN_CRYPTKEY||'live_crypt_t9ZpxRzAxOVFQOVaVhz0LDKTEHpUEHTW'
const safeUUID = process.env.D4SIGN_SAFEUUID||'f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0'
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

 async function sendtoSigner(signermail: string, docuuid: string):Promise<any>{
  
  Logger.info(`Sending document ${docuuid} to user ${signermail}...`);
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
      Logger.error(`Error while sending documento to user ${signermail} to sign...`);
      return error
    }
    Logger.info(`Document ${docuuid} successfully sent to user ${signermail}...`);
    mailresponse = response.body
  })
  
  return mailresponse

 }

export async function getSafes(req: Express.Request, res: Express.Response) {
  
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
  
export async function d4signflow(req: Express.Request, res: Express.Response) {
     
  let presencial

  if (!req.body.presencial || req.body.presencial === false) {
    presencial = "0"
  }else{
    presencial = "1"
  }
  
  if (!fs.existsSync(filespath + req.body.filename)) {
    Logger.error("File not found on downloads path!");
    return res.status(500).send({"error":"file not found!"});
  }

  const docuuid = await sendDoc(req.body.filename)

  const signerdoc = {"signers" : [
    {
      "email": req.body.signermail,
      "act": "1",
      "foreign": "0",
      "certificadoicpbr": "0",
      "assinatura_presencial": presencial,
      "embed_methodauth": "email"
  }]}

  const signerresponse = await registerSigners(signerdoc, docuuid)
  await sendtoSigner(req.body.signermail, docuuid)

  const finalresponse = {
    "status":"success",
    "key_signer": signerresponse.message[0].key_signer,
    "email": signerresponse.message[0].email,
    "safe_uuid":safeUUID,
    "doc_uuid":docuuid
  }

  return res.status(200).send(finalresponse)

}