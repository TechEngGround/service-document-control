const App = require('./src/app')
const Logger = require('./src/util/log')

const port = parseInt(process.env.SERVER_PORT) || 3000;
const app = new App();

const start = async () => {
  try {
    Logger.info('Starting http server...');
    app.server.listen(port, '0.0.0.0', (error, address) => {
      if (error) {
        Logger.error(`Server not initialized, error: ${error}`);
        process.exit(1);
      }
      Logger.info(`Server started on address: ${address}`);
    });
  } catch (error) {
    Logger.error(error);
    process.exit(1);
  }
};

start();