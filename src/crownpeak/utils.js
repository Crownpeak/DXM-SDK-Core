const colouriseErrors = () => {
    // See https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (args) => {
        process.stdout.write("\x1b[31m"); // red
        originalError(args);
        process.stdout.write("\x1b[0m"); // reset
    }
    console.warn = (args) => {
        process.stdout.write("\x1b[33m"); // yellow
        originalWarn(args);
        process.stdout.write("\x1b[0m"); // reset
    }
};

module.exports = {
    colouriseErrors: colouriseErrors,
    colorizeErrors: colouriseErrors
};