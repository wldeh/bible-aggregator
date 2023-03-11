export interface Verse {
  book: string
  chapter: string | undefined
  verse: string | undefined
  text: string | null
}

export interface DataItem {
  name: string
  chapter: string
  verses: string
}

export interface ContentItem {
  book: string
  chapter: string
  verses: Verse[]
}

export interface BookInfo {
  name: string
  chapter: string
  verses: string
}
