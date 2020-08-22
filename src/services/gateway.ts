import Logger from "../util/log";
import axios from "axios";
import { getJwt } from "../util/jwt";

const gateway_url = process.env.GATEWAY_URL || 'http://localhost:3000'

const documentsEndpoint = gateway_url + "/docs/";
const usersEndpoint = gateway_url + "/users/";
const loginEndpoint = gateway_url + "/login/adminlogin";

export async function saveOnDB(
  userId: string,
  filename: string,
  documentType: string
) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${getJwt()}` },
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
  signers_keys: Array<String>,
  signers_emails: Array<String>
) {
  try {
    const data = {
        d4sign_id: d4sign_id,
        signers_keys: signers_keys,
        signers_emails: signers_emails
    };

    Logger.info(`Updating Mongo Document ${filename} on DB.`);

    await axios.put(
      documentsEndpoint + `updatedoc/${mongo_Id}`,
      data,
      {headers: { Authorization: `Bearer ${getJwt()}`,
                 'Content-Type': 'application/json' }
      },
    );
    Logger.info(`Document ${filename} updated.`);

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
