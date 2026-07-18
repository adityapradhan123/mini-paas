const fs = require('fs');
const path = require('path');

const detectProjectType = (contextPath) => {
  const hasFile = (filename) => fs.existsSync(path.join(contextPath, filename));

  if (hasFile('Dockerfile')) return 'custom'; // user already provided one
  if (hasFile('package.json')) return 'node';
  if (hasFile('requirements.txt')) return 'python';
  if (hasFile('index.html')) return 'static';

  throw new Error('Could not detect project type — no package.json, requirements.txt, index.html, or Dockerfile found');
};

const getStartCommand = (contextPath) => {
  const pkgPath = path.join(contextPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (pkg.scripts && pkg.scripts.start) {
    return 'npm start';
  }
  if (pkg.main) {
    return `node ${pkg.main}`;
  }
  return 'node index.js'; // fallback guess
};

const generateDockerfile = (contextPath, projectType) => {
  let dockerfileContent = '';

  switch (projectType) {
    case 'node': {
      const startCmd = getStartCommand(contextPath);
      dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ${JSON.stringify(startCmd.split(' '))}
`;
      break;
    }

    case 'python': {
      dockerfileContent = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
`;
      break;
    }

    case 'static': {
      dockerfileContent = `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
`;
      break;
    }

    default:
      throw new Error(`No Dockerfile generator available for type: ${projectType}`);
  }

  fs.writeFileSync(path.join(contextPath, 'Dockerfile'), dockerfileContent);
  return dockerfileContent;
};

module.exports = { detectProjectType, generateDockerfile };