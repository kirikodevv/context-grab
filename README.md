Context Grab


Context Grab is an NPM library that takes a function and copies that function plus all referenced context to your clipboard.

It's built to be used to properly port blocks of code, with context, into different projects or LLM chats.

To execute it, run
```
yarn start <basePath> <filePath> <functionName>
```

Though, the package is best leverage by its Webstorm Plugin (Context Grabber)

Here's an example block of code.

```javascript

// app.ts
function testFunc() {
  const value = Service.testMethodFunc();
  console.log(value)
}

//service.ts

export class Service {

  static testMethodFunc() {
    return MyService.testMethodFuncNum()
  }

  static testMethodFuncNum() {
    return 1
  }

}
```

Run this execution

```
yarn start . ./app.ts testFunc
```

For this output
```javascript
import { Service } from '@/Service';

//service.ts
class Service {
  static testMethodFunc() {
    return MyService.testMethodFuncNum() + UtilService.OtherNumberFunc();
  }
  static testMethodFuncNum() {
    return 1;
  }
}

//app.ts
function testFunc() {
  const value = MyService.testMethodFunc();
  console.log(value);
}
//======================


```

You may add a `grab.json` to your root to configure certain behaviours. Heres an example file

```json
{
  "type": "typescript", // language (javascript | typescript)
  "aliasConfig": {
    "@utils": "./src/utils",
    "@components": "./src/components"
  }, // any alias configs
  "includeImports": true, // Include imports 
  "depth": 4, // how many files deep to get context from
  "order": [
    "imports",
    "types",
    "classes",
    "functions"
  ], // what order to append fields in
  "prettier": {
    "semi": false,
    "singleQuote": true
  } // prettier rules for formatting
}
```
