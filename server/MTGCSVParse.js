function parseMTGCSV(string) {
    //Get the database data
    const parsedData = {};

    //Split the file using \n or \r\n depending on the file carriage return type
    const parsedString = string.split(new RegExp('\r\n|\n'));

    //Get data from each line
    parsedString.forEach(c => {
        let arr = c.split(' ');
        if (arr.length > 1) {
            let count = arr[0];
            let name = arr.slice(1).join(' ');
            if (parsedData[name]) {
                parsedData[name] += parseInt(count);
            } else {
                parsedData[name] = parseInt(count)

            }
        }
    });

    return parsedData;
}

export { parseMTGCSV };