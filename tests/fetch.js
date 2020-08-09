import { strict as assert } from "assert"

import { fetch } from "../lib/net/http2_client.js"

export const id = "Test HTTP2 Client"

export const assertions = {
  "Fetch Google Homepage": {
    function: async () =>
      assert.doesNotReject(
        async () => await fetch("https://google.com", { ":path": "/" }, {})
      ),
  },
}
