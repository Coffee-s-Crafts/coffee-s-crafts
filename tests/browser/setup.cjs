const { createPreviewServer } = require('../../scripts/serve.cjs');
module.exports = async () => {
  const server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', resolve);
  });
  return async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  };
};
