interface versionInfo {
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
