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

