// Initializes a repository with the pwa-shell and pwa-server

import { exec } from "child_process"

import { log, error } from "../logger/logger.js"

/**
 * @param {String} repository
 * @param {String} target
 */
function git_clone_command(repository, target) {
  return `git clone --depth=1 ${repository} ${target}`
}

export async function init(options) {
  if (
    options.pwa_shell_repository === "" ||
    options.pwa_server_repository === ""
  ) {
    return Promise.reject("Invalid repositories!")
  }

  const pwa_shell_clone = new Promise((resolve, reject) =>
    exec(
      git_clone_command(
        options.pwa_shell_repository,
        options.clone_target_directory
      ),
      (err, stdout, stderr) =>
        err || stderr ? reject(err || stderr) : resolve(stdout)
    )
  )

  const pwa_server_clone = new Promise((resolve, reject) =>
    exec(
      git_clone_command(
        options.pwa_server_repository,
        options.clone_target_directory
      ),
      (err, stdout, stderr) =>
        err || stderr ? reject(err || stderr) : resolve(stdout)
    )
  )

  try {
    await Promise.all([pwa_shell_clone, pwa_server_clone])
  } catch (err) {
    error(err)
    return Promise.reject(err)
  }

  log(`Initializing current directory (${process.cwd()}) complete!`)
  return Promise.resolve()
}
