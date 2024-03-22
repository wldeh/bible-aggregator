import { z } from 'zod';

const languageSchema = z.object({
  name: z.string(),
  code: z.string(),
  level: z.string(),
});

const countrySchema = z.object({
  name: z.string(),
  code: z.string(),
});

export const versionInfoSchema = z.object({
  id: z.string(),
  version: z.string(),
  description: z.string(),
  scope: z.string(),
  language: languageSchema,
  country: countrySchema,
  numeralSystem: z.string(),
  script: z.string(),
  archivist: z.string(),
  copyright: z.string(),
  localVersionName: z.string(),
  localVersionAbbreviation: z.string(),
});

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
