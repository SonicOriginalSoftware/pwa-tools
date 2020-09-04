import { strict as assert } from "assert"

import { main, usage } from "../bin/main.js"
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

      const logger = new Console({ stdout: stdout_stream, stderr: stderr_stream })

      await main(["", ""], logger)
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

      const logger = new Console({ stdout: stdout_stream, stderr: stderr_stream })

      await main(["", "", "bogus"], logger)
      assert.match(stderr.trim(), /Unknown command: bogus/)
      assert.deepStrictEqual(stdout.trim(), usage.trim())
      assert.deepStrictEqual(process.exitCode, -1)
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

      const logger = new Console({ stdout: stdout_stream, stderr: stderr_stream })

      await main(["", "", "help"], logger)
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

      const logger = new Console({ stdout: stdout_stream, stderr: stderr_stream })

      await main(["", "", "version"], logger)
      assert.deepStrictEqual(stderr.trim(), "")
      assert.deepStrictEqual(stdout.trim(), pkg.version)
    },
    skip: false,
  },
}
