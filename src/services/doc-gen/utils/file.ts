import { inMemoryDb } from './common'

export const fileUtils = {
  // Get file content by name
  getFileContent: (fileName: string): Uint8Array | null => {
    return inMemoryDb.files[fileName] || null
  },

  // Save content to file using the provided name
  saveFile: (fileName: string, content: string): Uint8Array => {
    const encoder = new TextEncoder()
    const encodedContent = encoder.encode(content)
    inMemoryDb.files[fileName] = encodedContent
    return encodedContent
  },
}
