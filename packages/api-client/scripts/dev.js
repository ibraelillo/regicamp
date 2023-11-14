const { run } = require('./build')
const fs = require('fs')

fs.watch('../../apps/cms/src/api', async (file) => {
    await run()
})