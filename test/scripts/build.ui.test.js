/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
const { vol } = global.mockFs()

const AppScripts = require('../..')
const mockAIOConfig = require('@adobe/aio-lib-core-config')

const Bundler = require('parcel-bundler')
jest.mock('parcel-bundler')

const mockOnProgress = jest.fn()

beforeEach(() => {
  // those are defined in __mocks__
  Bundler.mockConstructor.mockReset()
  Bundler.mockBundle.mockReset()
  mockOnProgress.mockReset()
  global.cleanFs(vol)
})

test('Should fail build if app has no frontend', async () => {
  global.loadFs(vol, 'sample-app')
  vol.unlinkSync('/web-src/index.html')
  mockAIOConfig.get.mockReturnValue(global.fakeConfig.tvm)

  const scripts = await AppScripts()

  await expect(scripts.buildUI()).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('app has no frontend') }))
})

test('should send a warning if namespace is not configured (for action urls)', async () => {
  global.loadFs(vol, 'sample-app')
  mockAIOConfig.get.mockReturnValue(global.configWithMissing(global.fakeConfig.tvm, 'runtime.namespace'))
  const warningMock = jest.fn()
  const scripts = await AppScripts({ listeners: { onWarning: warningMock } })
  await scripts.buildUI()

  expect(warningMock).toHaveBeenCalledWith(expect.stringContaining('injected urls to backend actions are invalid'))
})

test('should build static files from web-src/index.html', async () => {
  global.loadFs(vol, 'sample-app')
  mockAIOConfig.get.mockReturnValue(global.fakeConfig.tvm)
  Bundler.mockBundle.mockImplementation(async () => {
    global.addFakeFiles(vol, '/dist/web-src-prod/', ['fake.js', 'fake.js.map'])
  })

  const scripts = await AppScripts({ listeners: { onProgress: mockOnProgress } })

  await scripts.buildUI()

  expect(Bundler.mockConstructor).toHaveBeenCalledWith(r('/web-src/index.html'), expect.objectContaining({
    publicUrl: './',
    outDir: r('/dist/web-src-prod')
  }))
  expect(Bundler.mockBundle).toHaveBeenCalledTimes(1)
  expect(mockOnProgress).toHaveBeenCalledWith(n('dist/web-src-prod/fake.js'))
  expect(mockOnProgress).toHaveBeenCalledWith(n('dist/web-src-prod/fake.js.map'))
})

test('No backend is present', async () => {
  global.loadFs(vol, 'sample-app')
  mockAIOConfig.get.mockReturnValue(global.fakeConfig.tvm)
  vol.unlinkSync('./manifest.yml')

  const scripts = await AppScripts()
  await scripts.buildUI()
  expect(scripts._config.app.hasBackend).toBe(false)
})
