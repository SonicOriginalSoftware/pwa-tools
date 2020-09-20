import { strict as assert } from "assert"
import { PassThrough } from "stream"
import { Console } from "console"
import { rmdirSync } from "fs"
import { join } from "path"

import {
  initialize,
  usage,
  sos_resources_url,
} from "../lib/commands/initialize.js"
import { TEST_DATA_DIR } from "./test_data.js"

export const id = "Test resource initialization"

const init_dir = join(TEST_DATA_DIR, "init")

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

      assert.doesNotReject(() => initialize(["help"], logger))
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Default init": {
    function: async () => {
      try {
        await initialize(["--defaults", "-t", init_dir], console)
      } catch (err) {
        return assert.fail(err)
      }
      return assert.ok(true)
    },
    skip: false,
  },
  "Add toast-lane component": {
    function: async () => {
      try {
        await initialize(
          [
            "-r",
            sos_resources_url,
            "--cache",
            "-t",
            join(init_dir, "app"),
            "-p",
            "components/toast-lane",
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
  "Add cached IndexedDB library": {
    function: async () => {
      try {
        await initialize(
          [
            "-r",
            sos_resources_url,
            "--cache",
            "-t",
            join(init_dir, "app"),
            "-p",
            "lib/indexedDB",
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
}

rmdirSync(init_dir, { recursive: true })
