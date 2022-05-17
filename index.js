const core = require('@actions/core');
const axios = require("axios");

async function recreate(connectUri, stackId, imageUri) {
  const [username, password, host] = connectUri.split('@');
  axios.defaults.baseURL = host;
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  const auth = await axios.post('/auth', { username, password })
  // console.log(auth.data)
  axios.defaults.headers.common.Authorization = `Bearer ${auth.data.jwt}`;

  const registries = await axios.get(`/endpoints/${stackId}/registries`)
  const ghRegistry = registries.data.find((reg) => reg.URL.includes('ghcr.io'))
  const listContainers = await axios.get(`/endpoints/${stackId}/docker/containers/json?all=1`)
  console.log(listContainers.data)
  const selected = listContainers.data.find((container) => container.Image === imageUri);
  const containerName = selected.Names[0].slice(1);
  // console.log(containerName)
  const tokenData = {
    registryId: ghRegistry.Id
  }
  const ghToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  // console.log('ghToken', ghRegistry, ghToken)
  const create = await axios.post(`/endpoints/${stackId}/docker/images/create?fromImage=${encodeURIComponent(imageUri)}`, {}, {
    headers: {
      'x-registry-auth': ghToken
    }
  })
  // console.log('create', create.data)
  if (selected.State === 'running') {
    const stop = await axios.post(`/endpoints/${stackId}/docker/containers/${selected.Id}/stop`)
    console.log('stop', stop.data)
  }
  const rename = await axios.post(`/endpoints/${stackId}/docker/containers/${selected.Id}/rename?name=${containerName}-old`)
  console.log('rename', rename.data)
  const container = await axios.post(`/endpoints/${stackId}/docker/containers/create?name=${containerName}`, selected)
  console.log('container', container.data)
  try {
    const connect = await axios.post(`/endpoints/${stackId}/docker/networks/${Object.keys(selected.NetworkSettings.Networks)[0]}/connect`)
    console.log('connect', connect.data)
  } catch (error) {
    console.log('error', error.message)
  }
  const start = await axios.post(`/endpoints/${stackId}/docker/containers/${container.data.Id}/start`)
  console.log('start', start.data)
  const control = await axios.put(`/resource_controls/${container.data.Portainer.ResourceControl.Id}`, { "AdministratorsOnly": true, Public: false })
  console.log('control', control.data)
  const deleteContainer = await axios.delete(`/endpoints/${stackId}/docker/containers/${selected.Id}?force=true&v=1`)
  console.log('deleteContainer', deleteContainer.data)
}

try {
  const portainerHost = core.getInput('portainer-host');
  const username = core.getInput('username');
  const password = core.getInput('password');
  const stackId = core.getInput('stack-id');
  const imageUri = core.getInput('image-uri');
  // console.log(`portainerHost: ${portainerHost}!`);
  // console.log(`username: ${username}!`);
  // console.log(`password: ${password}!`);
  // console.log(`imageUri: ${imageUri}!`);
  recreate(portainerHost, username, password, stackId, imageUri);
} catch (error) {
  core.setFailed(error.message);
}
