import Logger from "../util/log";
import axios from "axios";
import { getJwt } from "../util/jwt";

const gateway_url = process.env.GATEWAY_URL || 'http://localhost:3000'

const documentsEndpoint = gateway_url + "/docs/";
const usersEndpoint = gateway_url + "/users/";
const loginEndpoint = gateway_url + "/login/adminlogin";
const jwt = getJwt() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRvY2FkbWluQGFkbWluIiwiaWF0IjoxNTk4MjM3ODk3fQ.lZ1ivxrBhCBIg0ny5ExdafgpcxOqNNfwtvzTW9nSVeA"

export async function saveOnDB(
  userId: string,
  filename: string,
  documentType: string
) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${jwt}` },
    };

    Logger.info(`Save Document ${filename} on DB for user ${userId}.`);
    const document = {
      type: documentType,
      path: filename,
    };
    const documentsResponse = await axios.post(
      documentsEndpoint + "createdoc",
      { ...document },
      config
    );
    Logger.info(`Document ${filename} saved! Updating user.`);

    const userFilter = { _id: userId };
    const userResponse = await axios.post(
      usersEndpoint + "getuserbyfilter",
      { filter: userFilter },
      config
    );

    userResponse.data[0].documents.push(documentsResponse.data);
    await axios.put(
      usersEndpoint + "updateuser/" + userId,
      { documents: userResponse.data[0].documents },
      config
    );
    Logger.info(`User Updated!`);

    return { message: "Document Saved and User Updated!", error: undefined };
  } catch (error) {
    Logger.error(error);
    return { message: "Error", error };
  }
}

export async function updateDocDB(
  mongo_Id: string,
  d4sign_id: string,
  filename: string,
  signers_info: Array<Object>,
) {
  try {
    const data = {
        d4sign_id: d4sign_id,
        signers_info: signers_info
    };

    Logger.info(`Updating Mongo Document ${filename} on DB.`);

    await axios.put(
      documentsEndpoint + `updatedoc/${mongo_Id}`,
      data,
      {headers: { Authorization: `Bearer ${jwt}`,
                 'Content-Type': 'application/json' }
      },
    );
    Logger.info(`Document ${filename} updated.`);

  } catch (error) {
    Logger.error(error);
    return { message: "Error", error };
  }
}

export async function updateDocSignStatus(
  update_info: any,
) {
  try {

    let data, index
    
    const config = {
      headers: { Authorization: `Bearer ${jwt}` },
    };
    
    Logger.info(`Updating Mongo Document d4sign id > ${update_info.uuid} sign status on DB.`);
    
    const docFilter = { d4sign_id: update_info.uuid  };
    const docResponse = await axios.post(
      documentsEndpoint + "getdocbyfilter",
      { filter: docFilter },
      config
      );

    let signers_info = docResponse.data[0].signers_info
      
    await signers_info.forEach(function (value: any) {
      if(value.email == update_info.email){
        index = signers_info.indexOf(value)
        signers_info[index] = {
          email:value.email,
          key_signer:value.key_signer,
          signed:true,
          signed_ts: Date.now(),
          doc_uuid:value.doc_uuid
        }
      }
    })

    data = {
      signers_info: signers_info
    }

    await axios.put(
      documentsEndpoint + `updatedoc/${docResponse.data[0]._id}`,
      data,
      {headers: { Authorization: `Bearer ${jwt}`,
                 'Content-Type': 'application/json' }
      },
    );
    Logger.info(`Document d4sign id > ${update_info.uuid} sign status updated.`);

  } catch (error) {
    Logger.error(error);
    return { message: "Error", error };
  }
}

export async function login(email: string, password: string) {
  Logger.info("Making request to login...");
  const result = await axios.post(loginEndpoint, { email, password });

  Logger.info("Request done!");
  return result.data.token;
}
