import { request as https_request } from "https"

import { connect, constants as http2_constants } from "http2"
import { URL } from "url"

/** @param {String} content_type_header */
function create_buffer(content_type_header) {
  let charset = "utf-8"
  const content_type_split = content_type_header.split(";")
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
 * An http/2 request
 *
 * Uses a request stream to get information about headers and data
 *
 * @param {import('http2').ClientHttp2Session} session
 * @param {URL} url
 * @param {import("http2").constants.HTTP2_HEADER_METHOD} [method]
 * @param {Object.<String, any>} request_headers
 * @param {import("http2").ClientSessionRequestOptions} [options]
 * @param {Number} [timeout]
 * @param {Buffer} [body]
 *
 * @returns {Promise<{headers: Object.<String, any>, data: String | Buffer}>}
 */
async function http2_fetch(
  session,
  url,
  method,
  request_headers,
  options,
  timeout,
  body
) {
  return new Promise((resolve, reject) => {
    // TODO Need to handle POST requests (by doing a .write(post_data))

    /** @type {Object.<String, any>} */
    let response_headers
    /** @type {Buffer} */
    let captured_data
    const request = session.request(
      {
        [http2_constants.HTTP2_HEADER_METHOD]: method,
        [http2_constants.HTTP2_HEADER_PATH]: url.pathname,
        ...request_headers,
      },
      options
    )
    if (timeout)
      request.setTimeout(timeout, () =>
        request.close(http2_constants.NGHTTP2_CANCEL)
      )
    request
      .on("error", (err) => reject(err))
      .on("response", (headers) => {
        response_headers = headers
        captured_data = create_buffer(response_headers["content-type"])
      })
      .on("data", (chunk) => (captured_data += chunk))
      .on("end", async () => {
        await new Promise((session_resolve) => {
          session.close(() => session_resolve())
        })
        resolve({ headers: response_headers, data: captured_data })
      })
      .end()
  })
}

/**
 * An https fetch request
 *
 * Uses the response -> message approach to get header and data information
 *
 * @param {URL} url
 * @param {import("http2").constants.HTTP2_HEADER_METHOD} [method]
 * @param {Object.<String, any>} request_headers
 * @param {Number} [timeout]
 * @param {Buffer} [body]
 *
 * @returns {Promise<{headers: Object<String, any>, data: String | Buffer}>}
 */
async function https_fetch(url, method, request_headers, timeout, body) {
  return new Promise((resolve, reject) => {
    // TODO Need to handle POST requests (by doing a .write(post_data))
    // TODO Add timeout handling

    https_request(
      {
        headers: request_headers,
        method: method,
        host: url.host,
        path: `${url.pathname}${url.search}`,
      },
      (message) => {
        /** @type {Object.<String, any>} */
        const response_headers = message.headers
        let captured_data = create_buffer(response_headers["content-type"])

        if (timeout)
          message.setTimeout(timeout, () => {
            message.destroy(new Error("Request timed out"))
          })
        message
          .on("error", (err) => reject(err))
          .on(
            "data",
            (chunk) => (captured_data = Buffer.concat([captured_data, chunk]))
          )
          .on("end", () =>
            resolve({ headers: response_headers, data: captured_data })
          )
      }
    ).end()
  })
}

/**
 * Make a network fetch request
 *
 * @param {String} url
 * @param {Object} [$1]
 * @param {Boolean} [$1.follow_redirects]
 * @param {import('http2').constants.HTTP2_HEADER_METHOD} [$1.method]
 * @param {Object.<String, any>} [$1.request_headers]
 * @param {import('http2').ClientSessionRequestOptions} [$1.session_request_options]
 * @param {Number} [$1.timeout]
 * @param {Buffer} [$1.body]
 */
export async function fetch(
  url,
  {
    follow_redirects = false,
    method = http2_constants.HTTP2_METHOD_GET,
    request_headers = {},
    session_request_options = {},
    timeout = 5000,
    body,
  } = {}
) {
  var session = connect(url)
  let h2 = true
  if (session.alpnProtocol !== "h2") {
    h2 = false
    session.close()
  }

  let parsed_url = new URL(url)
  let trying = true
  /** @type {{headers: Object<String, any>, data: String | Buffer}} */
  let response = { headers: {}, data: "" }

  while (trying) {
    response = h2
      ? await http2_fetch(
          session,
          parsed_url,
          method,
          request_headers,
          session_request_options,
          timeout,
          body
        )
      : await https_fetch(parsed_url, method, request_headers, timeout, body)

    if (response.headers) {
      const location = response.headers[http2_constants.HTTP2_HEADER_LOCATION]

      if (location === undefined) {
        trying = false
      } else if (follow_redirects) {
        parsed_url = new URL(location)
      }
    } else {
      trying = false
    }
  }

  return response
}
