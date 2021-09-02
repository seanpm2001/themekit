import { createCompiler } from '../../compiler'
import { ThemekitObserver } from '../observer'
import { simple, anotherSimple } from './fixtures/simple'

describe('ThemekitObserver', () => {
  test('should trigger watch after first compile', async () => {
    const onWatch = jest.fn()
    const compile = createCompiler(simple.context)
    const observer = new ThemekitObserver(simple.options, compile)
    observer.watch(onWatch)
    await wait(100)
    expect(onWatch).toBeCalledTimes(1)
    expect(onWatch).toHaveBeenLastCalledWith({
      css: [
        {
          content: 'token1:value-1,token2:value-2',
          destination: 'tokens.css',
        },
      ],
    })
  })

  test('should trigger watch after token update', async () => {
    const onWatch = jest.fn()
    const compile = createCompiler(simple.context)
    const observer = new ThemekitObserver(simple.options, compile)
    observer.watch(onWatch)
    observer.update('token1', 'value-1-updated')
    await wait(100)
    expect(onWatch).toBeCalledTimes(2)
    expect(onWatch).toHaveBeenLastCalledWith({
      css: [
        {
          content: 'token1:value-1-updated,token2:value-2',
          destination: 'tokens.css',
        },
      ],
    })
  })

  test('should reset tokens on reset', async () => {
    const onWatch = jest.fn()
    const compile = createCompiler(simple.context)
    const observer = new ThemekitObserver(simple.options, compile)
    observer.watch(onWatch)
    observer.update('token1', 'value-1-updated')
    observer.reset()
    await wait(100)
    expect(onWatch).toBeCalledTimes(3)
    expect(onWatch).toHaveBeenLastCalledWith({
      css: [
        {
          content: 'token1:value-1,token2:value-2',
          destination: 'tokens.css',
        },
      ],
    })
  })

  test('should set new tokens on setTokens', async () => {
    const onWatch = jest.fn()
    const compile = createCompiler(simple.context)
    const observer = new ThemekitObserver(simple.options, compile)
    observer.watch(onWatch)
    observer.update('token1', 'value-1-updated')
    observer.setTokens(anotherSimple.options.tokens)
    await wait(100)
    expect(onWatch).toBeCalledTimes(3)
    expect(onWatch).toHaveBeenLastCalledWith({
      css: [
        {
          content: 'token-another1:value-another-1,token-another2:value-another-2',
          destination: 'tokens.css',
        },
      ],
    })
  })

  test('should reset to tokens set on setTokens', async () => {
    const onWatch = jest.fn()
    const compile = createCompiler(simple.context)
    const observer = new ThemekitObserver(simple.options, compile)
    observer.watch(onWatch)
    observer.update('token1', 'value-1-updated')
    observer.setTokens(anotherSimple.options.tokens)
    observer.update('token-another2', 'value-another-2-updated')
    observer.reset()
    await wait(100)
    expect(onWatch).toBeCalledTimes(5)
    expect(onWatch).toHaveBeenLastCalledWith({
      css: [
        {
          content: 'token-another1:value-another-1,token-another2:value-another-2',
          destination: 'tokens.css',
        },
      ],
    })
  })
})

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), delay)
  })
}
