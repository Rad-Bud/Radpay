
const hex = "00530061006D0061002C00200053006F006C00640065002000320030002E003000330036002C0036003500440041";

function decode(content) {
    let str = '';
    for (let i = 0; i < content.length; i += 4) {
        str += String.fromCharCode(parseInt(content.substr(i, 4), 16));
    }
    return str;
}

const decoded = decode(hex);
console.log("Decoded:", decoded);

const regex = /([\d\.,]+)\s*(DA|DZD|Da|da)?/;
const match = decoded.match(regex);

if (match) {
    console.log("Match[1] (Raw Number):", match[1]);
    let normalized = match[1].replace(/\./g, '').replace(',', '.');
    console.log("Normalized:", normalized);
    console.log("Parsed Float:", parseFloat(normalized));
} else {
    console.log("No regex match");
}
