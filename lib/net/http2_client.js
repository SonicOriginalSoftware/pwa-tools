import { connect } from "http2"

/**
 * @param {String} domain
 * @param {import("http").OutgoingHttpHeaders} headers
 * @param {any} options
 */
export async function fetch(domain, headers, options) {
  /** @type {import("http2").ClientHttp2Session | null} */
  let session = null
  /** @type {import('net').Socket | null} */
  let socket = null

  try {
    [session, socket] = await new Promise((resolve, reject) =>
      connect(domain, (session, socket) => resolve([session, socket]))
    )
  } catch (err) {
    return Promise.reject(err)
  }

  const session_error_promise = new Promise((resolve, reject) => {
    session?.on("error", (err) => reject(err))
  })

  const request_stream = session?.request(headers, options)
  let data = ""

  const response_promise = new Promise((resolve, reject) => {
    request_stream?.on("response", (headers, flags) =>
      resolve([headers, flags])
    )
  })
  const data_promise = new Promise((resolve, reject) => {
    request_stream?.on("data", (chunk) => {data += chunk; resolve()})
  })
  const end_promise = new Promise((resolve, reject) => {
    request_stream?.on("end", () => {session?.close(); resolve()})
  })
  const request_error_promise = new Promise((resolve, reject) => {
    request_stream?.on("error", (err) => reject(err))
  })
  request_stream?.end()

  let response_headers = []
  let response_flags = []
  let empty_promises = null

  try {
    [[response_headers, response_flags], empty_promises] = await Promise.race([
      Promise.all([response_promise, data_promise, end_promise]),
      request_error_promise,
      session_error_promise
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  return [response_headers, response_flags, data]
}
