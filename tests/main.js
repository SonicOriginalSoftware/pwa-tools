import { strict as assert } from "assert"

import { usage } from "../lib/usage.js"
import { main } from "../bin/main.js"
import pkg from "../package.json"
import { Console } from "console"
import { PassThrough } from "stream"

export const id = "Test main function"

export const assertions = {
  "No argument given": {
    function: async () => {
      let stdout = ""
      let stderr = ""
      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))
      await main(
        ["", ""].entries(),
        new Console({ stdout: stdout_stream, stderr: stderr_stream })
      )
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Bogus argument given": {
    function: async () => {
      let stdout = ""
      let stderr = ""
      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))
      await main(
        ["", "", "bogus"].entries(),
        new Console({ stdout: stdout_stream, stderr: stderr_stream })
      )
      assert.match(stderr.trim(), /Unknown command: bogus/)
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Help command given": {
    function: async () => {
      let stdout = ""
      let stderr = ""
      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))
      await main(
        ["", "", "help"].entries(),
        new Console({ stdout: stdout_stream, stderr: stderr_stream })
      )
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), usage.trim())
    },
    skip: false,
  },
  "Version command given": {
    function: async () => {
      let stdout = ""
      let stderr = ""
      const stdout_stream = new PassThrough()
      stdout_stream.on("data", (chunk) => (stdout += chunk))
      const stderr_stream = new PassThrough()
      stderr_stream.on("data", (chunk) => (stderr += chunk))
      await main(
        ["", "", "version"].entries(),
        new Console({ stdout: stdout_stream, stderr: stderr_stream })
      )
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), pkg.version)
    },
    skip: false,
  },
}
