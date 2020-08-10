import { strict as assert } from "assert"

import { fetch } from "../lib/net/http2_client.js"

export const id = "Test HTTP2 client"

export const assertions = {
  "Fetch test site": {
    function: async () => {
      const test_site_content = await fetch(
        "https://sonicoriginalsoftware.github.io",
        { ":path": "/test-site/" },
        {}
      )
      const expected_content = "<html>\n<body>\nTest site!\n</body>\n</html>\n"
      assert.deepStrictEqual(test_site_content[2], expected_content)
    },
  },
}
