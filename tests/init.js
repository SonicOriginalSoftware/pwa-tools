import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"
import { rmdir } from "fs/promises"

import { init, usage } from "../lib/commands/init.js"

export const id = "Test init"

const test_dir = "./test-data"

export const assertions = {
  "Show Initialize help": {
    function: () => {
      let stdout = ""
      let stderr = ""

      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))

      const logger = new Console({
        stdout: stdout_stream,
        stderr: stderr_stream,
      })

      assert.doesNotReject(() => init(["help"], logger))
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Default Initialize": {
    function: async () => {
      await rmdir(test_dir, { recursive: true })

      try {
        await init(["-t", test_dir, "-u", test_dir + "/server"], console)
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
}
