import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"
import { rmdir } from "fs/promises"
import { join } from "path"

import { add_resource, usage } from "../lib/commands/add_resource.js"
import { TEST_DATA } from "./test_data.js"

export const id = "Test add component"

const add_resource_dir = join(TEST_DATA, "add-resource")

export const assertions = {
  "Show add-resource help": {
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

      assert.doesNotReject(() => add_resource(["help"], logger))
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Add toast-lane component": {
    function: async () => {
      await rmdir(add_resource_dir, { recursive: true })

      try {
        await add_resource(
          [
            "-t",
            "component",
            "-n",
            "toast-lane",
            "-p",
            join(add_resource_dir, "components"),
          ],
          console
        )
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
  "Add IndexedDB library": {
    function: async () => {
      await rmdir(add_resource_dir, { recursive: true })

      try {
        await add_resource(
          ["-t", "lib", "-n", "indexedDB", "-p", join(add_resource_dir, "lib")],
          console
        )
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
}
