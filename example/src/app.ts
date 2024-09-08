import {MyService} from "@/MyService";

const test = () => {
  console.log(MyService.testMethodFunc());
}

function testFunc() {
  const value = MyService.testMethodFunc();
  console.log(value)
}
