const JPNtoEN = {
    "ド": " c",
    "レ": " d",
    "ミ": " e",
    "フ": " f",
    "ソ": " g",
    "ラ": " a",
    "シ": " b",
    "♭": "es",
    "♯": "is"
};

export const convertJPNtoEN = (input: any) => {
    let result: string = "";
    for (let i in input) {
        const str = input[i];
        if (str === "ァ") continue;
        if (str.match(/(ド|レ|ミ|フ|ソ|ラ|シ|♭|♯)/)) {
            result = result.concat(JPNtoEN[str]);
        } else {
            result = result.concat(str);
        }
    }
    console.log(`converted: ${result}`);
    return result
};