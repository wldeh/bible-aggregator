import * as types from 'src/types/processingTypes'
import fs from 'fs'
import path from 'path'

export async function readFolder(currentDir: string): Promise<string[]> {
  let files: string[] = []

  const entries = await fs.promises.readdir(currentDir, {
    withFileTypes: true
  })

  for (const entry of entries) {
    const fullPath: string = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files = files.concat(await readFolder(fullPath))
    } else {
      files.push(fullPath)
    }
  }

  return files
}

export function getHighestChapters(data: types.DataItem[]): types.DataItem[] {
  return data.reduce((acc: types.DataItem[], curr: types.DataItem) => {
    const existing = acc.find((item) => item.name === curr.name)
    if (existing) {
      if (Number(existing.chapter) < Number(curr.chapter)) {
        existing.chapter = curr.chapter
        existing.verses = curr.verses
      }
    } else {
      acc.push(curr)
    }
    return acc
  }, [])
}
