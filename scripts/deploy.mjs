// Builds the site and force-pushes dist/ as the gh-pages branch, which GitHub Pages serves.
// A separate index keeps the deploy out of the working tree and out of main's history.
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const env = { ...process.env, GIT_INDEX_FILE: resolve('.git/gh-pages-index') }
const git = (args) => execSync(`git ${args}`, { env }).toString().trim()

execSync('npm run build', { stdio: 'inherit' })
git('--work-tree=dist add -A')
const commit = git(`commit-tree ${git('write-tree')} -m Deploy`)
git(`push -f origin ${commit}:refs/heads/gh-pages`)
console.log('Pushed to gh-pages. https://ehteshambuildagents.github.io updates in a minute or two.')
