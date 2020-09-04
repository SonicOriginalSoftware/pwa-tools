import { strict as assert } from "assert"

import { init } from "../lib/commands/init.js"

export const id = "Test init"

export const assertions = {
  "Default Initialize": {
    function: () => assert.doesNotReject(() => init(["-t", "./test-data"], console)),
    skip: true,
  },
}
