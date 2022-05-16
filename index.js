const core = require('@actions/core');

try {
  const portainerHost = core.getInput('portainer-host');
  const username = core.getInput('username');
  const password = core.getInput('password');
  const containerName = core.getInput('container-name');
  console.log(`portainerHost: ${portainerHost}!`);
  console.log(`username: ${username}!`);
  console.log(`password: ${password}!`);
  console.log(`containerName: ${containerName}!`);
} catch (error) {
  core.setFailed(error.message);
}
