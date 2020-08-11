import { request } from "https"
import { connect } from "http2"

/** @param {String | undefined} content_type_header */
function create_buffer(content_type_header) {
  let charset = "utf-8"
  const content_type_split = content_type_header?.split(";")
  const content_type =
    content_type_split !== undefined ? content_type_split[0] : "text/html"

  if (
    content_type_header !== undefined &&
    content_type_header.includes("charset")
  ) {
    const charset_string = "charset="
    const charset_start =
      content_type_header.indexOf(charset_string) + charset_string.length
    let charset_end = content_type_header.indexOf(";", charset_start)
    charset_end = charset_end === -1 ? content_type_header.length : charset_end
    charset = content_type_header.substring(charset_start, charset_end)
  } else {
    switch (content_type) {
      case "application/zip":
        charset = "binary"
        break
    }
  }

  // @ts-ignore
  return Buffer.from("", charset)
}

/**
 * @param {import('http2').ClientHttp2Session} session
 * @param {import('http').OutgoingHttpHeaders} headers
 * @param {import("http2").ClientSessionRequestOptions} options
 *
 * @returns {Promise<[import("http").IncomingHttpHeaders | null, Buffer | null]>}
 */
async function http2_fetch(session, headers, options) {
  /** @type {import("http").IncomingHttpHeaders | null} */
  let response_headers = null

  /** @type {Buffer | null} */
  let data = null

  const session_error_promise = new Promise((resolve, reject) =>
    session?.on("error", (err) => (err ? reject(err) : resolve()))
  )

  const request_stream = session?.request(headers, options)

  const response_promise = new Promise((resolve, reject) =>
    request_stream?.on("response", (headers) => {
      response_headers = headers
      data = create_buffer(headers["content-type"])
      resolve()
    })
  )

  const data_promise = new Promise((resolve, reject) =>
    request_stream?.on("data", (chunk) => {
      data += chunk
      resolve()
    })
  )

  const end_promise = new Promise((resolve, reject) =>
    request_stream?.on("end", () => {
      session?.close()
      resolve()
    })
  )

  const request_error_promise = new Promise((resolve, reject) =>
    request_stream?.on("error", (err) => (err ? reject(err) : resolve()))
  )

  request_stream?.end()

  try {
    await Promise.race([
      Promise.all([response_promise, data_promise, end_promise]),
      request_error_promise,
      session_error_promise,
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  return [response_headers, data]
}

/**
 * @param {String} domain
 * @param {import('http').OutgoingHttpHeaders} headers
 *
 * @returns {Promise<[import("http").IncomingHttpHeaders | null, Buffer | null]>}
 */
async function https_fetch(domain, headers) {
  /** @type {import('https').RequestOptions} */
  const options = {
    // @ts-ignore
    method: headers["method"] || "GET",
    hostname: domain.substring(domain.indexOf("/") + 2),
    // @ts-ignore
    path: headers[":path"],
  }

  /** @type {import("http").IncomingHttpHeaders | null} */
  let response_headers = null

  /** @type {Buffer | null} */
  let data = null

  let session_request = request(options)

  const response_promise = new Promise((resolve, _) =>
    session_request?.on("response", (message) => {
      response_headers = message.headers
      data = create_buffer(response_headers["content-type"])
      resolve()
    })
  )

  const data_promise = new Promise((resolve, _) =>
    session_request?.on("data", (chunk) => {
      data += chunk
      resolve()
    })
  )

  const end_promise = new Promise((resolve, _) =>
    session_request?.on("end", () =>
      resolve()
    )
  )

  const request_error_promise = new Promise((_, reject) =>
    session_request?.on("error", (err) => reject(err))
  )

  session_request.end()

  try {
    response_headers = await Promise.race([
      Promise.all([response_promise, data_promise, end_promise]),
      request_error_promise,
    ])
  } catch (err) {
    return Promise.reject(err)
  }

  return [response_headers, data]
}

/**
 * @param {String} domain
 * @param {import("http").OutgoingHttpHeaders} headers
 * @param {import("http2").ClientSessionRequestOptions} options
 */
export async function fetch(domain, headers, options) {
  /** @type {import("http2").ClientHttp2Session | null} */
  let session = null

  try {
    session = await new Promise((resolve, reject) =>
      connect(domain, (session) => resolve(session))
    )
  } catch (err) {
    return Promise.reject(err)
  }

  if (session?.alpnProtocol === "h2") {
    return http2_fetch(session, headers, options)
  } else {
    session?.close()
    return https_fetch(domain, headers)
  }
}
