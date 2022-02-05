

class test {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

let t = new test("test");

async function relation(t: test) {
t.name = "newName";

}

relation(t);
console.log(t.name);





  