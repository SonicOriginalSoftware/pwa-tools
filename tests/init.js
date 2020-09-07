import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"

import { init, usage } from "../lib/commands/init.js"

export const id = "Test init"

export const assertions = {
  "Show Initialize help": {
    function: () => {
      let stdout = ""
      let stderr = ""

      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))

      const logger = new Console({ stdout: stdout_stream, stderr: stderr_stream })

      assert.doesNotReject(() => init(["help"], logger))
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Default Initialize": {
    function: () => assert.doesNotReject(() => init(["-t", "./test-data"], console)),
    skip: false,
  },
}
