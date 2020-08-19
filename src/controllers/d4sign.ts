import axios, {AxiosRequestConfig} from 'axios'
import Express from "express";
import FormData from 'form-data';
import fs from 'fs'

const endpoint = process.env.D4SIGN_URL||'http://demo.d4sign.com.br/api/v1'
const tokenapi = process.env.D4SIGN_TOKENAPI || 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1'
const cryptKey = process.env.D4SIGN_CRYPTKEY||'live_crypt_t9ZpxRzAxOVFQOVaVhz0LDKTEHpUEHTW'
const safeUUID = process.env.D4SIGN_SAFEUUID||'f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0'

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
  
export async function uploadDoc(req: Express.Request, res: Express.Response) {
     
  let data = new FormData();
  
  data.append('file', fs.createReadStream(req.body.docpath));
  data.append('tokenAPI', tokenapi);

  const uploadconfig: AxiosRequestConfig = {
    headers: {
      'tokenAPI': tokenapi, 
      ...data.getHeaders(),
      'Content-Type': 'application/json',
    },
    data: data
  }

  const uploadResponse = await axios.post(
    `${endpoint}/documents/${safeUUID}/upload?tokenAPI=${tokenapi}&cryptKey=${cryptKey}`,
    uploadconfig
  );
  res.status(200).send(uploadResponse.data[0]);
  return;
}