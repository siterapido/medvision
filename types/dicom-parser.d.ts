declare module 'dicom-parser' {
  export interface DataSet {
    byteArray: Uint8Array
    elements: Record<string, { dataOffset: number; length: number; fragments?: unknown }>
    string(tag: string): string | undefined
    uint16(tag: string): number | undefined
    int16(tag: string): number | undefined
    floatString(tag: string): number | undefined
    intString(tag: string): number | undefined
  }

  export function parseDicom(
    byteArray: Uint8Array,
    options?: Record<string, unknown>,
  ): DataSet
}
