import Importer from './data/importer'
import Content from './processing/content'
import Directory from './processing/directory'

async function main(url: string): Promise<void> {
  const outPath = `./${Math.random().toString(36).substring(2)}`
  await Importer.importFolder(url, outPath)
  await Directory.createDirs(outPath)
  await Content.populate(outPath)
}
