import { strict as assert } from "assert"

import { fetch } from "../lib/net/http2_client.js"

export const id = "Test network client"
const timeout = 800
const wiggle_room = 10
const expected_content = Buffer.from(
  "<html>\n<body>\nTest site!\n</body>\n</html>\n"
)

export const assertions = {
  "HTTP/2 Fetch test site": {
    function: async () => {
      try {
        var test_site_content = await fetch(
          "https://sonicoriginalsoftware.github.io/test-site/",
          { timeout: timeout }
        )
      } catch (err) {
        assert.fail(err)
      }
      assert.deepStrictEqual(test_site_content.data, expected_content)
    },
    skip: false,
  },
  "HTTP/2 Check timeout": {
    function: async () => {
      const start_time = process.hrtime()
      try {
        await fetch("https://sonicoriginalsoftware.github.io/test-site/", {
          timeout: timeout,
        })
      } catch (err) {
        assert.fail(err)
      }
      const duration = process.hrtime(start_time)[1] / 1000000
      const comparison = timeout + wiggle_room
      assert.deepStrictEqual(
        duration <= comparison,
        true,
        `${duration} > ${comparison}`
      )
    },
    skip: false,
  },
  "HTTPS Fetch test site": {
    function: async () => {
      const test_site_content = await fetch(
        "https://sonicoriginalsoftware.github.io/test-site/",
        { timeout: timeout }
      )
      assert.deepStrictEqual(test_site_content.data, expected_content)
    },
    skip: false,
  },
}
