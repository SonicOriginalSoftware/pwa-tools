import { strict as assert } from "assert"

import { init } from "../lib/commands/init.js"

export const id = "Test init"

export const assertions = {
  "Default Initialize": {
    function: async () =>
      assert.doesNotReject(async () =>
        await init(
          "https://github.com/sonicoriginalsoftware/pwa-shell/archive/default.zip",
          "https://github.com/sonicoriginalsoftware/pwa-server/archive/default.zip",
          "./test-data",
        )
      ),
    skip: false
  },
}
