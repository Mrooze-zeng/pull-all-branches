const {
  commands,
  window,
  workspace,
  StatusBarAlignment,
  ProgressLocation,
} = require("vscode");

const Git = require("./git");
const commadId = "pull-all.pull";
const tooltip = "Pull all remote update!";

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
        window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: tooltip,
            cancellable: false,
          },
          async function (progress) {
            progress.report({ increment: 5 });
            git.logger(
              `============run on ${new Date().toString()}==============`,
            );
            const currentBranch = git.getCurrentBranch();
            const updatedBranch = [];
            git.fetch();
            progress.report({ increment: 10, message: "Start pulling..." });
            const branches = git.getBranches();
            let step = Math.floor(80 / branches.length);
            branches.forEach((branch) => {
              const [local, remote] = branch;
              if (remote && git.getRemoteCommitCount(...branch)) {
                updatedBranch.push(local);
                git.checkout(local);
                git.pull();
              }
              progress.report({ increment: step, message: `Pulling ${local}` });
            });
            git.checkout(currentBranch);
            message = `There is no branch updated!`;
            if (updatedBranch.length) {
              message = `${
                updatedBranch.length
              } branch(es) updated:\n${updatedBranch.join("\n")}`;
            }

            progress.report({
              increment: branches.length ? 10 : 90,
              message: message,
            });
            window.showInformationMessage(message);
            return;
          },
        );
      };
    } catch (error) {
      console.log(error);
    }
  }
  let disposable = commands.registerCommand(commadId, commad);

  context.subscriptions.push(disposable);
}

function initStatusBar(context) {
  const statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  statusBar.command = commadId;
  context.subscriptions.push(statusBar);
  statusBar.text = `$(arrow-down) PULL ALL`;
  statusBar.tooltip = tooltip;
  statusBar.show();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
