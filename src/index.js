const { commands, window, workspace, StatusBarAlignment } = require("vscode");

const Git = require("./git");
const commadId = "pull-all.pull";

function activate(context) {
  const currentFolder = workspace.workspaceFolders[0];
  const isGitExist = Git.checkGit();

  let message = "There is no git here!";
  let commad = function () {
    window.showInformationMessage(message);
  };
  if (isGitExist) {
    try {
      const projectRoot = Git.getProjectRoot(currentFolder.uri.path);
      const git = new Git({ cwd: projectRoot });
      initStatusBar(context);
      commad = function () {
        const currentBranch = git.getCurrentBranch();
        const updatedBranch = [];
        git.fetch();
        git.getBranches().forEach((branch) => {
          const [local, remote] = branch;
          if (remote && git.getRemoteCommitCount(...branch)) {
            updatedBranch.push(local);
            git.checkout(local);
            git.pull();
          }
        });
        git.checkout(currentBranch);
        message = `There is no branch updated!`;
        if (updatedBranch.length) {
          message = `${
            updatedBranch.length
          } branch(es) updated:\n${updatedBranch.join("\n")}`;
        }

        window.showInformationMessage(message);
      };
    } catch (error) {}
  }
  let disposable = commands.registerCommand(commadId, commad);

  context.subscriptions.push(disposable);
}

function initStatusBar(context) {
  const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  statusBar.command = commadId;
  context.subscriptions.push(statusBar);
  statusBar.text = `$(arrow-down) PULL ALL`;
  statusBar.tooltip = "Pull all remote update!";
  statusBar.show();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
