const BaseHasher = require('../../hashing/base')

const BASE_CFG = {
    salt: { source: "string", value: "NOPE" }
}

function makeBaseHasher(cfg=BASE_CFG) {
    return new BaseHasher(cfg)
}

test("BaseHasher creation", () => {
    expect(() => { new BaseHasher({}) }).toThrow();
    expect(() => { new BaseHasher({
        salt: {
            source: "NOT STRING",
        }
    }) }).toThrow();
})

test("BaseHasher::generateHashForExtractedObject", () => {

    const h = makeBaseHasher();

    expect(() => { h.generateHashForExtractedObject({ static: [], to_translate: [], reference: []}) }).toThrow()

})

test("BaseHasher::generateHash", () => {

    const h = makeBaseHasher();

    expect(h.generateHash("TEST123")).toEqual("3RYYVQ6SB2UT5NKYHRBKLRBZUR6WHXXEUCV5LPATTYAQEFCZWLSA====")

})