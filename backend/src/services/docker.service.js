const Docker = require('dockerode');
const path = require('path');
const tar = require('tar-fs');

// On Windows/Mac, Docker Desktop exposes a named pipe/socket automatically
const docker = new Docker();

const listContainers = async () => {
  const containers = await docker.listContainers({ all: true });
  return containers;
};

const pingDocker = async () => {
  try {
    const info = await docker.info();
    return { connected: true, info };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

const buildImage = async (contextPath, imageName, onLog = () => {}) => {
  const tarStream = tar.pack(contextPath);

  return new Promise((resolve, reject) => {
    docker.buildImage(tarStream, { t: imageName }, (err, stream) => {
      if (err) return reject(err);

      docker.modem.followProgress(
        stream,
        (err, res) => (err ? reject(err) : resolve(res)),
        (event) => {
          const message = event.stream || JSON.stringify(event);
          onLog(message);
        }
      );
    });
  });
};

const runContainer = async (imageName, containerName, hostPort, containerPort) => {
  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    ExposedPorts: { [`${containerPort}/tcp`]: {} },
    HostConfig: {
      PortBindings: {
        [`${containerPort}/tcp`]: [{ HostPort: `${hostPort}` }]
      }
    }
  });

  await container.start();
  return container.id;
};

const getContainerStatus = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Running ? 'running' : 'stopped';
  } catch (err) {
    // Container doesn't exist at all (was deleted)
    if (err.statusCode === 404) {
      return 'not_found';
    }
    throw err;
  }
};

module.exports = { listContainers, pingDocker, buildImage, runContainer, getContainerStatus };

