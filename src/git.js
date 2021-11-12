const { spawnSync } = require("child_process");

module.exports = class Git {
  constructor({ cwd = "" } = {}) {
    this.cwd = cwd;
    // console.log(this.getStatus());
  }
  gitSpawnSync(...args) {
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
    return stdout.toString().trim();
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
    return (stdout.toString().trim().match(/>/g) || []).length;
  }
  checkout(branch = "") {
    return this.gitSpawnSync("checkout", branch);
  }
  pull() {
    return this.gitSpawnSync("pull");
  }
  fetch() {
    return this.gitSpawnSync("fetch", "--prune");
  }
};
