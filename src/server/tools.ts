const map = Array.prototype.map;

export const convertJPNtoEN = (input: string) => {
    const JPNtoEN = {
        "ド":    " c",
        "レ":    " d",
        "ミ":    " e",
        "フ":    " f",
        "ソ":    " g",
        "ラ":    " a",
        "シ":    " b",
        "ァ":    " ",
        "♭":     "es",
        "♯":     "is"
    };
    const result = map.call(input, string => JPNtoEN[string] || string).join("");
    console.log(`converted: ${result}`);
    return result
};