

class test {
    testMap: Map<string, string>;
    name: string;
    constructor(name: string) {
        this.name = name;
        this.testMap = new Map();
    }

}


let mapOfMaps: Map<string, test> = new Map();
testFunc();
async function testFunc() {
    let firstTest = new test("onlyTest");

    mapOfMaps.set("testMap", firstTest);
    
await runtime();
    
}

async function runtime() {
    let theTest = mapOfMaps.get("testMap");
    if(theTest == undefined) return;

    console.log(theTest.name);

    let nameRef = theTest.name;

    nameRef = "newName";
    theTest.name = nameRef;

    console.log(theTest.name);
    if(mapOfMaps.get("testMap") == undefined) return;
    console.log(mapOfMaps.get("testMap"));

}


  