const fs = require('fs');

// Generate project.json file for uploading to Qoom
fs.appendFile(
    'build/project.json',
    '{\n    "homepage": "index.html"\n}',
    function (err) {
        if (err)
            console.log('Failed to create Qoom project file.\n' + err);
        else
            console.log('Qoom project file has been successfully created.');
    }
);