require('dotenv').config();

import App from './app'
import Logger from './util/log'

const port = process.env.SERVER_PORT && parseInt(process.env.SERVER_PORT) || 3002;
const app = new App();

const start = async () => {
  try {
    Logger.info('Starting http server...');
    app.server.listen(port, '0.0.0.0', () => {
      Logger.info(`Server started.`);
    });
  } catch (error) {
    Logger.error(error);
    process.exit(1);
  }
};

start();