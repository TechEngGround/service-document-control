import axios, {AxiosRequestConfig} from 'axios'
import Express from "express";
import FormData from 'form-data';
import fs from 'fs'
import request from 'request'

const endpoint = process.env.D4SIGN_URL||'http://demo.d4sign.com.br/api/v1'
const tokenapi = process.env.D4SIGN_TOKENAPI || 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1'
const cryptKey = process.env.D4SIGN_CRYPTKEY||'live_crypt_t9ZpxRzAxOVFQOVaVhz0LDKTEHpUEHTW'
const safeUUID = process.env.D4SIGN_SAFEUUID||'f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0'
const filespath = './downloads/'

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
  
export async function sendToSign(req: Express.Request, res: Express.Response) {
     
  let data = new FormData();
  
  if (fs.existsSync(filespath + req.body.filename)) {
    console.log("File Exists!")
    console.log(filespath + req.body.filename)
  }else{
    console.log("File does not Exists!")
  }
  
  const content = fs.readFileSync(filespath + req.body.filename)
 
  const full_endpoint =  `${endpoint}/documents/${safeUUID}/uploadbinary?tokenAPI=${tokenapi}&cryptKey=${cryptKey}`

  var options = {
    method: 'POST',
    url: 'http://demo.d4sign.com.br/api/v1/documents/f55711c5-8bb0-4bb9-b3e4-091e46c4bdc0/uploadbinary',
    qs: {
      tokenAPI: 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1',
      cryptKey: 'live_crypt_t9ZpxRzAxOVFQOVaVhz0LDKTEHpUEHTW'
    },
    headers: {'content-type': 'multipart/form-data; boundary=---011000010111000001101001'},
    formData: {
      base64_binary_file: content.toString('base64'),
      tokenAPI: 'live_4d21d725a36f9190cf00533deec531d25a182bb4a07c7df19cfc4cb48bb763e1',
      mime_type: 'application/pdf'
    }
  };

  request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);

})
}