const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e) {
        return '';
    }
}

function findGhCli() {
    const standardPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
    if (fs.existsSync(standardPath)) return `"${standardPath}"`;
    return 'gh';
}

function main() {
    const currentBranch = run('git branch --show-current');
    if (!currentBranch || currentBranch === 'main') {
        console.error('Error: Please checkout a feature branch before running create-pr.');
        process.exit(1);
    }

    console.log(`[PR Creator] Target Branch: ${currentBranch} -> main`);

    const prBodyPath = path.join(process.cwd(), '.planning', 'PR_BODY.md');
    if (!fs.existsSync(prBodyPath)) {
        console.error(`Error: ${prBodyPath} not found. Please ensure PR_BODY.md is generated.`);
        process.exit(1);
    }

    const ghCmd = findGhCli();
    const title = `feat: ${currentBranch} implementation`;

    console.log(`[PR Creator] Creating GitHub Pull Request using populated ${prBodyPath}...`);

    try {
        const output = execSync(`${ghCmd} pr create --base main --head ${currentBranch} --title "${title}" --body-file "${prBodyPath}"`, { encoding: 'utf8' });
        console.log(`✅ Pull Request Created Successfully!\n${output}`);
    } catch (err) {
        console.warn(`\n[Notice] GitHub CLI authentication required. Please run:\n  gh auth login\nThen rerun npm run pr.`);
        console.log(`\nAlternatively, copy the populated body from:\n  ${prBodyPath}`);
    }
}

main();
