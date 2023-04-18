import fs from 'fs'
import path from 'path'
import { DataItem } from 'src/types/processingTypes'

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

export function getHighestChapters(data: DataItem[]): DataItem[] {
  return data.reduce((acc: DataItem[], curr: DataItem) => {
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
