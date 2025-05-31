import fs from 'fs'
import config from './config.js'
import { execSync } from 'child_process'
import stylelint from 'stylelint'
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import cssnano from 'cssnano'
import configureLogger from './logger.js'

// Setup logger with specific context
const log = configureLogger('Styles')

// Determine the desired operation based on command line argument
const operation = process.argv[2]

// Function to lint SCSS files using stylelint
const lintScss = async () => {
  log.info('Linting SCSS...')
  try {
    const result = await stylelint.lint({
      files: `${config.path.scss}/**/*.scss`,
      configFile: '.stylelintrc.json',
      formatter: 'string',
    })

    if (result.errored) {
      console.log(result.report) // Log errors if linting failed
      throw new Error('Linting errors found')
    } else {
      log.success('Lint SCSS') // Log success if no errors found
    }
  } catch (error) {
    throw error // Rethrow error to be handled by the caller
  }
}

// Function to compile SCSS to CSS using Sass and enhance CSS with PostCSS plugins
const compileSass = async () => {
  const sassCommand = `sass --quiet --style expanded --source-map --embed-sources --no-error-css --load-path=node_modules ${config.path.scss}/${config.fileNames.css}.scss:${config.path.css}/${config.fileNames.css}.css`
  log.info('Compiling CSS...')
  try {
    execSync(sassCommand)
    log.success('Compile SCSS to CSS') // Log success if script runs without errors
  } catch (error) {
    log.error(
      `Compile SCSS to CSS hasn't been completed! ${error.stdout.toString()}`
    ) // Log failure and show error output
  }

  const cssPath = `${config.path.css}/${config.fileNames.css}.css`
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf-8')
    const result = await postcss([autoprefixer]).process(cssContent, {
      from: cssPath,
      to: cssPath,
    })
    fs.writeFileSync(cssPath, result.css)
    if (result.map) {
      fs.writeFileSync(`${cssPath}.map`, result.map.toString()) // Write source map if available
    }
    log.success('Added vendor prefixes and generated source map')
  }
}

// Helper function to minify a single CSS file
const minifySingleCssFile = async (inputPath, outputPath) => {
  const cssContent = await fs.promises.readFile(inputPath, 'utf8')
  const result = await postcss([
    cssnano({
      preset: [
        'default',
        {
          discardComments: { removeAll: true },
        },
      ],
    }),
  ]).process(cssContent, {
    from: inputPath,
    to: outputPath,
    map: { inline: false }, // Generate external source map files
  })

  await fs.promises.writeFile(outputPath, result.css)
  if (result.map) {
    await fs.promises.writeFile(`${outputPath}.map`, result.map.toString())
  }

  log.success(`Minified CSS and generated source map`)
}

// Function to minify all non-RTL CSS files
const minifyCss = async () => {
  const files = await fs.promises.readdir(config.path.css)
  const cssFiles = files.filter(
    (file) =>
      file.endsWith('.css') &&
      !file.endsWith('.min.css')
  )

  if (cssFiles.length === 0) {
    log.error('No CSS files found to minify.')
    return
  }

  for (const file of cssFiles) {
    const cssPath = `${config.path.css}/${file}`
    const minCssPath = `${config.path.css}/${file.replace('.css', '.min.css')}`
    await minifySingleCssFile(cssPath, minCssPath)
  }
}

// Main function to orchestrate the build process based on command line argument
const main = async () => {
  switch (operation) {
    case 'compile':
      await lintScss()
      await compileSass()
      break
    case 'minify':
      await minifyCss()
      break
    default:
      log.error(
        'Invalid command. Use either "compile" or "minify"'
      )
  }
}

main().catch((error) => log.error(error.message))
