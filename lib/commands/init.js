// Initializes a repository with the pwa-shell and pwa-server

import { execSync } from "child_process";

import { log, error } from "../logger/logger.js"

export async function init() {
  log(`Initializing current directory (${process.cwd()}) for pwa...`)

  // TODO TRY to clone the pwa-shell into the current working directory

  // TODO TRY to clone the pwa-server into the current working directory

  log(`Initializing current directory (${process.cwd()}) complete!`)
}
