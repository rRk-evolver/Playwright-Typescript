module.exports = {
  default: {
    require: [
      'src/steps/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    forceExit: false,
    failFast: false,
    strict: true,
    tags: process.env.TAGS || 'not @skip',
    parallel: 1, // Single thread for initial testing
    retry: parseInt(process.env.RETRIES) || 1,
    retryTagFilter: '@flaky',
    timeout: 60000, // 60 second timeout
    worldParameters: {
      browser: process.env.BROWSER || 'chromium',
      headless: process.env.HEADLESS !== 'false',
      timeout: parseInt(process.env.TIMEOUT) || 30000,
      screenshot: process.env.SCREENSHOT || 'failure',
      video: process.env.VIDEO || 'failure',
      trace: process.env.TRACE || 'retain-on-failure'
    }
  }
};