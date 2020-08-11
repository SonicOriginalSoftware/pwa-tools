// Initializes a repository with the pwa-shell and pwa-server

import { parse } from "url"

import { fetch } from "../net/http2_client.js"

/** @param {typeof import("../../bin/main.js").options} options */
export async function init(options) {
  let pwa_shell_url = null
  try {
    pwa_shell_url = parse(options.pwa_shell_archive)
  } catch (err) {
    return Promise.reject("pwa-shell URL invalid!")
  }

  let pwa_server_url = null
  try {
    pwa_server_url = parse(options.pwa_server_archive)
  } catch (err) {
    return Promise.reject("pwa-server URL invalid!")
  }

  /** @type {import("http").IncomingHttpHeaders | null} */
  let pwa_shell_headers = null
  /** @type {Buffer | null} */
  let pwa_shell_data = null

  /** @type {import("http").IncomingHttpHeaders | null} */
  let pwa_server_headers = null
  /** @type {Buffer | null} */
  let pwa_server_data = null

  try {
    [
      [pwa_shell_headers, pwa_shell_data],
      [pwa_server_headers, pwa_server_data],
    ] = await Promise.all([
      fetch(
        `${pwa_shell_url.protocol}//${pwa_shell_url.host}`,
        // @ts-ignore
        { ":path": pwa_shell_url.path },
        {}
      ),
      fetch(
        `${pwa_server_url.protocol}//${pwa_server_url.host}`,
        // @ts-ignore
        { ":path": pwa_server_url.path },
        {}
      ),
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  // TODO Check to see if the headers sent back redirects and follow them
  // appropriately if so

  // TODO Extract the pwa_shell_data and pwa_server_data
  // And write them to the options.target_directory

  return Promise.resolve()
}
