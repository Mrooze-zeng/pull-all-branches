const { spawnSync } = require("child_process");
const { window } = require("vscode");

const extensionOutputChannelName = "pull-all";

module.exports = class Git {
  constructor({ cwd = "" } = {}) {
    this.cwd = cwd;
    this.log = window.createOutputChannel(extensionOutputChannelName);
  }
  logger(message = "") {
    console.log(message);
    this.log.appendLine(message);
  }
  gitSpawnSync(...args) {
    this.logger(`Run: git ${args.join(" ")}`);
    return spawnSync("git", args, {
      cwd: this.cwd,
    });
  }
  getStatus() {
    return this.gitSpawnSync("status");
  }
  static getProjectRoot(cwd = "") {
    const { stdout, stderr } = spawnSync(
      "git",
      ["rev-parse", "--show-toplevel"],
      {
        cwd: cwd,
      },
    );
    if (stderr.length) {
      throw new Error(stderr.toString());
    }
    return stdout.toString().trim();
  }
  static checkGit() {
    const { status } = spawnSync("git", ["version"]);
    return !(status === null);
  }
  checkRemoteBranchExist(branch = "") {
    branch = branch || this.getCurrentBranch();
    const { stdout } = this.gitSpawnSync(
      "ls-remote",
      "--heads",
      "origin",
      branch,
    );
    return !!stdout.length;
  }
  getCurrentBranch() {
    const { stdout, stderr } = this.gitSpawnSync(
      "rev-parse",
      "--abbrev-ref",
      "HEAD",
    );
    if (stderr.length) {
      throw new Error(stderr.toString());
    }
    const res = stdout.toString().trim();
    this.logger(`Current branch: ${res}`);
    return res;
  }
  getBranches() {
    const { stdout, stderr } = this.gitSpawnSync(
      "for-each-ref",
      "--format=%(refname:short) %(upstream:short)",
      "refs/heads",
    );
    if (stderr.length) {
      return [];
    }
    return stdout
      .toString()
      .trim()
      .split("\n")
      .map((branch) => {
        return branch.split(" ");
      });
  }
  getRemoteCommitCount(local = "", remote = "") {
    const { stdout, stderr } = this.gitSpawnSync(
      "rev-list",
      "--left-right",
      `${local}...${remote}`,
    );
    if (stderr.length) {
      return 0;
    }
    const count = (stdout.toString().trim().match(/>/g) || []).length;
    this.logger(`\t${local}: ${count}`);
    return count;
  }
  checkout(branch = "") {
    return this.gitSpawnSync("checkout", branch);
  }
  pull() {
    const { stdout } = this.gitSpawnSync("pull");
    this.logger(`Pull: ${stdout.toString()}`);
  }
  fetch() {
    return this.gitSpawnSync("fetch", "--prune");
  }
};
