const {Document, Sheet} = require('../document')

const SHEETS = [
    new Sheet("sheet1", [ {a:"A"}]),
    new Sheet("sheet2", []),

];

const DOCUMENT = new Document(SHEETS);


test("Document", () => {
    expect(DOCUMENT.sheets).toEqual(SHEETS)
})

test("Sheet", () => {
    const s = SHEETS[0];
    expect(s.name).toEqual("sheet1")
    expect(s.data).toEqual([ {a:"A"}])
})