import { spawn } from 'node:child_process';

const cwd = process.cwd();
const port = process.env.PORT || '3001';
const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
const args =
  process.platform === 'win32'
    ? ['/c', 'npx', 'next', 'dev', '--hostname', '127.0.0.1', '--port', port]
    : ['next', 'dev', '--hostname', '127.0.0.1', '--port', port];

const child = spawn(command, args, {
  cwd,
  env: process.env,
  stdio: 'inherit',
});

const forwardExit = () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  child.kill('SIGTERM');
};

process.on('SIGINT', forwardExit);
process.on('SIGTERM', forwardExit);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
