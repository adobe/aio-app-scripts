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

const Openwhisk = require('openwhisk')
const BaseScript = require('../lib/abstract-script')
const utils = require('../lib/utils')

class GetUrl extends BaseScript {

  async run (options = {}) {
    const taskName = 'GetUrl'
    this.emit('start', taskName)
    let urls = {}
    if(options.action) {
      const action = this.config.manifest.package.actions[options.action]
      if(!action) {
        throw new Error(`No action with name ${options.action} found`)
      }
      this.config.manifest.package.actions = {}
      this.config.manifest.package.actions[options.action] = action
    }
    const actionUrls = await utils.getActionUrls(this.config, true)
    urls.runtime = actionUrls
    if(options.cdn) {
      const cdnUrls = await utils.getActionUrls(this.config, false)
      urls.cdn = cdnUrls
    }
    this.emit('end', taskName)
    return urls
  }
}
module.exports = GetUrl
