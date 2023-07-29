import path from 'node:path'
import fs from 'node:fs'
import { generateDtsBundle, type CompilationOptions, type EntryPointConfig } from "dts-bundle-generator";

type Options = Omit<EntryPointConfig, 'filePath'> & {
  compilationOptions?: CompilationOptions
}

const dts = (options?: Options): import('bun').BunPlugin => {
  return {
    name: 'bun-dts-generator',
    async setup(build) {
      const { compilationOptions, ...rest }  = options || {}

      const entrypoints = [...build.config.entrypoints].sort()
      const entries = entrypoints.map((entry) => {
        return {
          filePath: entry,
          ...rest
        }
      })
      const result = await generateDtsBundle(entries, compilationOptions)

      const outDir = build.config.outdir || './dist'
      if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir);
      }

      await Promise.all(
        entrypoints.map((entry, index) => {
          const dtsFile = entry.replace(/^.*\//, '').replace(/\.ts$/, '.d.ts')
          const outFile = path.join(outDir, dtsFile)
          return Bun.write(outFile, result[index])
        })
      )
    }
  }
}

export default dts
