/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import phantom from 'phantom'
import GIFEncoder from 'gifencoder'
import pngFileStream from 'png-file-stream'
import fs from 'fs'

// If you want to use this logic, you'll need to add back a few modules to yarn
// phantom
// png-file-stream
// gifencoder

// This logic is currently disabled and left in an unfunctioning state. This would generate a gif of any page fully rendered to be
// sent via email.
//
// Commonly used to generate a gif of the chart displayed on the results page searching for alerts.
const width = 600
const height = 325
const encoder = new GIFEncoder(width, height)

// https://stackoverflow.com/a/36247412/1589147
const leftPad = (s, c, n) => {
  s = s.toString()
  c = c.toString()
  return s.length > n ? s : c.repeat(n - s.length) + s
}

(async function() {
  const instance = await phantom.create()
  const page = await instance.createPage()
  const status = await page.open('http://localhost:3000/example')
  console.log(status)

  await page.property('viewportSize', { width: width, height: height })
  await page.property('clipRect', { top: 0, left: 0, width: width, height: height })
  for (var i = 0; i < 5; i++) {
    await page.render(`/tmp/frames/frame${leftPad(i, "0", 3)}.png`)
  }
  await instance.exit()

  await pngFileStream('/tmp/frames/frame???.png')
    .pipe(encoder.createWriteStream({ repeat: 0, delay: 250, quality: 10 }))
    .pipe(fs.createWriteStream('/tmp/frames/example-render.gif'))
}())

