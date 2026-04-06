const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');
const packageJsonPath = path.join(projectRoot, 'package.json');
const serverJsPath = path.join(projectRoot, 'server.js');
const publicDirPath = path.join(projectRoot, 'public');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

(async () => {
    // 1. Compile React admin frontend → public/admin.bundle.js
    console.log('Compiling frontend...');
    await esbuild.build({
        entryPoints: [path.join(projectRoot, 'src', 'admin.tsx')],
        bundle: true,
        minify: true,
        platform: 'browser',
        target: ['es2020'],
        outfile: path.join(publicDirPath, 'admin.bundle.js'),
        jsx: 'automatic',
    });
    console.log('Frontend compiled.');

    // 2. Build dist folder for deployment
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });

    fs.copyFileSync(serverJsPath, path.join(distDir, 'server.js'));
    if (fs.existsSync(publicDirPath)) {
        fs.cpSync(publicDirPath, path.join(distDir, 'public'), { recursive: true });
    }

    // 3. Write dist/package.json with production-only deps
    const distPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        private: true,
        type: packageJson.type,
        main: 'server.js',
        scripts: {
            start: 'node server.js',
        },
        dependencies: {
            bcryptjs: packageJson.dependencies.bcryptjs,
            'cookie-parser': packageJson.dependencies['cookie-parser'],
            cors: packageJson.dependencies.cors,
            dotenv: packageJson.dependencies.dotenv,
            express: packageJson.dependencies.express,
            jsonwebtoken: packageJson.dependencies.jsonwebtoken,
            mysql2: packageJson.dependencies.mysql2,
        },
    };

    fs.writeFileSync(
        path.join(distDir, 'package.json'),
        `${JSON.stringify(distPackageJson, null, 2)}\n`
    );

    console.log('Build complete: dist folder is ready.');
})().catch((err) => {
    console.error('Build failed:', err.message);
    process.exit(1);
});