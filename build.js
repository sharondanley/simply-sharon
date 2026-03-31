const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');
const packageJsonPath = path.join(projectRoot, 'package.json');
const serverJsPath = path.join(projectRoot, 'server.js');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(serverJsPath, path.join(distDir, 'server.js'));

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const distPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    private: true,
    type: packageJson.type,
    main: 'server.js',
    scripts: {
        start: 'node server.js'
    },
    dependencies: {
        cors: packageJson.dependencies.cors,
        dotenv: packageJson.dependencies.dotenv,
        express: packageJson.dependencies.express,
        mysql2: packageJson.dependencies.mysql2
    }
};

fs.writeFileSync(
    path.join(distDir, 'package.json'),
    `${JSON.stringify(distPackageJson, null, 2)}\n`
);

console.log('Build complete: dist folder is ready.');