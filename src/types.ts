export interface Verse {
    book: string | undefined
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

  export interface versionInfo {
    id: string
    version: string
    description: string
    scope: string
    language: {
      name: string
      code: string
      level: string
    }
    country: {
      name: string
      code: string
    }
    numeralSystem: string
    script: string
    archivist: string
    copyright: string
    localVersionName: string
    localVersionAbbreviation: string
  }
  
  