// Initializes a repository with the pwa-shell and pwa-server

import { parse } from "url"

import { fetch } from "../net/http2_client.js"

/** @param {{pwa_shell_repository: String, pwa_server_repository: String, target_directory: String}} options */
export async function init(options) {
  let pwa_shell_url = null
  try {
    pwa_shell_url = parse(options.pwa_shell_repository)
  } catch (err) {
    return Promise.reject("pwa-shell URL invalid!")
  }

  let pwa_server_url = null
  try {
    pwa_server_url = parse(options.pwa_server_repository)
  } catch (err) {
    return Promise.reject("pwa-server URL invalid!")
  }

  const pwa_shell_fetch = fetch(
    `${pwa_shell_url.protocol}//${pwa_shell_url.host}`,
    // @ts-ignore
    { ":path": pwa_shell_url.path },
    {}
  )
  const pwa_server_fetch = fetch(
    `${pwa_server_url.protocol}//${pwa_server_url.host}`,
    // @ts-ignore
    { ":path": pwa_server_url.path },
    {}
  )

  let pwa_shell_headers = []
  let pwa_shell_flags = []
  let pwa_shell_data = ""

  let pwa_server_headers = []
  let pwa_server_flags = []
  let pwa_server_data = ""

  try {
    [
      [pwa_shell_headers, pwa_shell_flags, pwa_shell_data],
      [pwa_server_headers, pwa_server_flags, pwa_server_data],
    ] = await Promise.all([pwa_shell_fetch, pwa_server_fetch])
  } catch (err) {
    return Promise.reject(err)
  }

  // TODO Extract the pwa_shell_data and pwa_server_data
  // And write them to the options.target_directory

  return Promise.resolve()
}
