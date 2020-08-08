// Initializes a repository with the pwa-shell and pwa-server

import { exec } from "child_process"

import { log, error } from "../logger/logger.js"

export async function init(options) {
  log(`Initializing current directory (${process.cwd()}) for pwa...`)

  const pwa_shell_clone = new Promise((resolve, reject) =>
    exec(
      `git clone ${options.pwa_shell_repository} ${options.clone_target_directory}`,
      (err, stdout, stderr) => {
        err || stderr ? reject(err || stderr) : resolve(stdout)
      }
    )
  )

  const pwa_server_clone = new Promise((resolve, reject) =>
    exec(
      `git clone ${options.pwa_server_repository} ${options.clone_target_directory}`,
      (err, stdout, stderr) => {
        err || stderr ? reject(err || stderr) : resolve(stdout)
      }
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
