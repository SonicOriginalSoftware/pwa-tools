import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"
import { rmdir } from "fs/promises"
import { join } from "path"

import { init, usage } from "../lib/commands/init.js"
import { TEST_DATA } from "./test_data.js"

export const id = "Test init"

const init_dir = join(TEST_DATA, "init")

export const assertions = {
  "Show init help": {
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
  "Default init": {
    function: async () => {
      await rmdir(init_dir, { recursive: true })

      try {
        await init(["-t", init_dir, "-u", init_dir + "/server"], console)
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
}
