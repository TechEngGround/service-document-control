import Logger from "../util/log";
import axios from "axios";
import { getJwt } from "../util/jwt";

const documentsEndpoint = process.env.GATEWAY_URL + "/docs/";
const usersEndpoint = process.env.GATEWAY_URL + "/users/";
const loginEndpoint = process.env.GATEWAY_URL + "/login/adminlogin";

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

export async function login(email: string, password: string) {
  Logger.info("Making request to login...");
  const result = await axios.post(loginEndpoint, { email, password });

  Logger.info("Request done!");
  return result.data.token;
}
