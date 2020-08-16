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
 * @param {Buffer} [body]
 */
async function http2_fetch(
  session,
  url,
  method,
  request_headers,
  options,
  body
) {
  // TODO Need to handle POST requests (by doing a .write(post_data))

  return new Promise((resolve, reject) => {
    /** @type {Object.<String, any>} */
    let response_headers
    /** @type {Buffer} */
    let captured_data
    session
      .request(
        {
          [http2_constants.HTTP2_HEADER_METHOD]: method,
          [http2_constants.HTTP2_HEADER_PATH]: url.pathname,
          ...request_headers,
        },
        options
      )
      .on("error", (err) => reject(err))
      .on("response", (headers) => {
        response_headers = headers
        captured_data = create_buffer(response_headers["content-type"])
      })
      .on("data", (chunk) => (captured_data += chunk))
      .on("end", () => resolve([response_headers, captured_data]))
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
 * @param {Buffer} [body]
 *
 * @returns {Promise<[Object.<String, any>, Buffer]>}
 */
async function https_fetch(url, method, request_headers, body) {
  return new Promise((resolve, reject) => {
    // TODO Need to handle POST requests (by doing a .write(post_data))

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

        message
          .on("error", (err) => reject(err))
          .on("data", (chunk) => (captured_data += chunk))
          .on("end", () => resolve([response_headers, captured_data]))
      }
    ).end()
  })
}

/**
 * @param {import("http2").ClientHttp2Session} session
 * @param {String} url
 * @param {Boolean} follow_redirects
 * @param {import("http2").constants.HTTP2_HEADER_METHOD} [method]
 * @param {Object.<String, String>} [request_headers]
 * @param {import("http2").ClientSessionRequestOptions} [options]
 * @param {Buffer} [body]
 *
 * @returns {Promise<[Object.<String, any>, Buffer | null]>}
 */
async function fetch_loop(
  session,
  url,
  follow_redirects = true,
  method = http2_constants.HTTP2_METHOD_GET,
  request_headers,
  options,
  body
) {
  let parsed_url = new URL(url)
  /** @type {Object.<String, any>} */
  let response_headers
  /** @type {Buffer | null} */
  let captured_data = null
  let trying = true
  let status = 500

  while (trying) {
    if (session.alpnProtocol === "h2") {
      ;[response_headers, captured_data] = await http2_fetch(
        session,
        parsed_url,
        method,
        request_headers,
        options,
        body
      )
    } else {
      ;[response_headers, captured_data] = await https_fetch(
        parsed_url,
        method,
        request_headers,
        body
      )
    }

    status = response_headers[http2_constants.HTTP2_HEADER_STATUS]

    const location = response_headers[http2_constants.HTTP2_HEADER_LOCATION]
    if (location === undefined) {
      trying = false
    } else if (follow_redirects) {
      parsed_url = new URL(location)
    }
  }

  if (status !== 200) {
    return Promise.reject(`${url} retrieved status: ${status}`)
  }

  return [response_headers, captured_data]
}

/**
 * Make a network fetch request
 *
 * @param {String} url
 * @param {Boolean} follow_redirects
 * @param {import("http2").constants.HTTP2_HEADER_METHOD} [method]
 * @param {Object.<String, String>} [request_headers]
 * @param {import("http2").ClientSessionRequestOptions} [options]
 * @param {Buffer} [body]
 *
 * @returns {Promise<[Object.<String, any>, Buffer | null]>} An array [the response headers, the response data]
 */
export async function fetch(
  url,
  follow_redirects = true,
  method = http2_constants.HTTP2_METHOD_GET,
  request_headers,
  options,
  body
) {
  /** @type {import("http2").ClientHttp2Session} */
  var session = await new Promise((resolve) =>
    connect(url, (session) => resolve(session))
  )

  let return_value

  try {
    return_value = await fetch_loop(
      session,
      url,
      follow_redirects,
      method,
      request_headers,
      options,
      body
    )
  } catch (err) {
    return_value = Promise.reject(err)
  } finally {
    await new Promise((resolve) => session.close(() => resolve()))
  }

  return return_value
}
