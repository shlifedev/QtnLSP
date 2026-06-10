// language-server/dist/의 서버 번들을 VSCode 확장의 dist/로 복사한다.
// npm 스크립트에서 cp를 쓰면 Windows에서 깨지므로 node로 처리.
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'language-server', 'dist');
const destDir = path.join(__dirname, '..', 'vscode-extension', 'dist');

if (!fs.existsSync(path.join(srcDir, 'server.js'))) {
  console.error(`server bundle not found: ${path.join(srcDir, 'server.js')} — run "npm run webpack:server" first`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
for (const file of ['server.js', 'server.js.map']) {
  const src = path.join(srcDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destDir, file));
    console.log(`copied ${file} -> vscode-extension/dist/`);
  }
}
