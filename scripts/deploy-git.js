'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${result.status}`);
  }
}

// Override hexo-deployer-git: pull remote static files, merge into public/,
// commit and push WITHOUT --force. GitHub Actions then publishes public/.
hexo.extend.deployer.register('git', function (args) {
  const baseDir = this.base_dir;
  const publicDir = this.public_dir;
  const remoteUrl = args.repo || args.repository || process.env.HEXO_DEPLOYER_REPO;
  const branch = args.branch || 'master';
  const remoteName = args.remote || 'origin';

  if (!remoteUrl) {
    throw new Error('[deploy-git] deploy.repo is not configured in _config.yml');
  }

  const tmpWorktree = path.join(baseDir, '.deploy_merge_tmp');

  hexo.log.info('[deploy-git] Fetching latest %s/%s ...', remoteName, branch);
  run('git', ['fetch', remoteName, branch], baseDir);

  if (fs.existsSync(tmpWorktree)) {
    try {
      run('git', ['worktree', 'remove', tmpWorktree, '--force'], baseDir);
    } catch (e) {
      // ignore stale worktree errors
    }
    fs.rmSync(tmpWorktree, { recursive: true, force: true });
  }

  hexo.log.info('[deploy-git] Merging remote public/ into local public/ ...');
  run('git', ['worktree', 'add', '--detach', tmpWorktree, 'FETCH_HEAD'], baseDir);

  const remotePublic = path.join(tmpWorktree, 'public');
  if (fs.existsSync(remotePublic)) {
    fs.cpSync(remotePublic, publicDir, { recursive: true, force: true });
  } else {
    hexo.log.warn('[deploy-git] remote branch has no public/ folder; skipping merge.');
  }

  try {
    run('git', ['worktree', 'remove', tmpWorktree, '--force'], baseDir);
  } catch (e) {
    hexo.log.warn('[deploy-git] could not clean temp worktree: ' + e.message);
  }
  fs.rmSync(tmpWorktree, { recursive: true, force: true });

  hexo.log.info('[deploy-git] Committing merged public/ ...');
  run('git', ['add', 'public'], baseDir);
  const commitMsg = args.message || `Deploy site: ${new Date().toISOString()}`;
  const commit = spawnSync('git', ['commit', '-m', commitMsg], { cwd: baseDir, stdio: 'inherit' });
  if (commit.status !== 0) {
    hexo.log.info('[deploy-git] Nothing new to commit, continuing.');
  }

  hexo.log.info('[deploy-git] Rebasing onto latest %s/%s ...', remoteName, branch);
  run('git', ['pull', '--rebase', '--autostash', remoteName, branch], baseDir);

  hexo.log.info('[deploy-git] Pushing to %s ...', remoteName);
  run('git', ['push', remoteName, `HEAD:${branch}`], baseDir);

  hexo.log.info('[deploy-git] Done. GitHub Actions will publish public/.');
});

hexo.log.debug('[deploy-git] custom deployer registered');
