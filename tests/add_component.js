import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"
import { rmdir } from "fs/promises"
import { join } from "path"

import { add_component, usage } from "../lib/commands/add_component.js"
import { TEST_DATA } from "./test_data.js"

export const id = "Test init"

const add_component_dir = join(TEST_DATA, "add-component")

export const assertions = {
  "Show Add-Component help": {
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

      assert.doesNotReject(() => add_component(["help"], logger))
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Add test toast-lane component": {
    function: async () => {
      await rmdir(add_component_dir, { recursive: true })

      try {
        await add_component(["-n", "toast-lane", "-p", add_component_dir], console)
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
}
