let describe, it, assert, test, expect

if ('Bun' in globalThis) {
  describe = function describe(name, fn) {
    return globalThis.Bun.jest(caller()).describe(name, fn)
  }
  it = function it(name, fn) {
    return globalThis.Bun.jest(caller()).it(name, fn)
  }
  test = function test(name, fn) {
    return globalThis.Bun.jest(caller()).test(name, fn)
  }
  assert = function assert(value, message) {
    return globalThis.Bun.jest(caller()).expect(value, message)
  }
  expect = function expect(value, message) {
    return globalThis.Bun.jest(caller()).expect(value, message)
  }
  /** Retrieve caller test file. */
  function caller() {
    const Trace = Error
    const _ = Trace.prepareStackTrace
    Trace.prepareStackTrace = (_, stack) => stack
    const { stack } = new Error()
    Trace.prepareStackTrace = _
    const caller = stack[2]
    return caller.getFileName().replaceAll('\\', '/')
  }

  /** V8 CallSite (subset). */
} else if ('Deno' in globalThis === false && process.env.VITEST_WORKER_ID) {
  describe = await import('vitest').then((module) => module.describe)
  it = await import('vitest').then((module) => module.it)
  test = await import('vitest').then((module) => module.test)
  assert = await import('vitest').then((module) => module.assert)
  expect = await import('vitest').then((module) => module.expect)
} else {
  const nodeTest = await import('node:test')
  const nodeAssert = await import('node:assert')

  describe = nodeTest.describe
  test = nodeTest.test
  it = nodeTest.it
  assert = nodeAssert.strict

  // poor man's expect
  expect = function expect(value, message) {
    return {
      toBe(expected) {
        assert.deepStrictEqual(value, expected, message)
      },
      toStrictEqual(expected) {
        assert.deepStrictEqual(value, expected, message)
      },
      toThrowError(expected) {
        assert.throws(value, expected, message)
      },
      rejects: {
        toThrowError(expected) {
          return value
            .catch((error) => {
              assert(error.message.includes(expected), message)
            })
            .then(() => {
              if (typeof value !== 'object' || !value.then) {
                throw new Error(`Expected promise to reject, but it resolved with value: ${value}`)
              } else {
                value
                  .catch((error) => {
                    assert(error.message.includes(expected), message)
                  })
                  .then(() => {
                    if (typeof value !== 'object' || !value.then) {
                      throw new Error(
                        `Expected promise to reject, but it resolved with value: ${value}`,
                      )
                    }
                  })
              }
            })
        },
      },
    }
  }
}

export { describe, it, assert, test, expect }
