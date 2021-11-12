const { commands, window, workspace } = require("vscode");

const Git = require("./git");

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
      commad = function () {
        const currentBranch = git.getCurrentBranch();
        const updatedBranch = [];
        git.fetch();
        git.getBranches().forEach((branch) => {
          const [local] = branch;
          const count = git.getRemoteCommitCount(...branch);
          if (count) {
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
  let disposable = commands.registerCommand("pull-all.pull", commad);

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
