import fetch, { Response } from 'node-fetch'

import Importer from './data/importer'
import Content from './processing/content'
import Directory from './processing/directory'

const url =
  'https://app.thedigitalbiblelibrary.org/entries/_public_domain_entries_tabledata.json'

export default async function main(): Promise<void> {
  try {
    let count = 0
    const response: Response = await fetch(url)
    const initialData = await response.json()
    const array = initialData.aaData

    for await (const item of array) {
      count++
      console.log(`(${count + '/' + array.length}) Setting up: ${item[4]}`)
      await setupBible(
        `https://app.thedigitalbiblelibrary.org/entry?id=${item[0]}`
      )
    }
  } catch (error) {
    throw new Error(`test failed: ${error.message}`)
  }
}

async function setupBible(url: string): Promise<void> {
  try {
    const startTime = performance.now()
    const outPath = `./${Math.random().toString(36).substring(2)}`

    await Importer.importFolder(url, outPath)
    await Directory.createDirs(outPath)
    await Content.populate(outPath)

    const endTime = performance.now()
    const timeTaken = endTime - startTime
    console.log(`Finished In ${(timeTaken / 1000).toFixed(2)} seconds @ ${new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'})}}`)
  } catch (error) {
    console.error(`Error setting up Bible: ${error.message}`)
  }
}
