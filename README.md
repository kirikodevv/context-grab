# Context Grab

Context Grab is an NPM library that copies a function and all its referenced context to your clipboard. It's designed to seamlessly port code blocks with their context into different projects or LLM chats.

## Features

- Extracts functions with their full context
- Supports JavaScript and TypeScript
- Configurable through `grab.json`
- WebStorm plugin available for enhanced usability

## Installation

```bash
npm install context-grab
# or
yarn add context-grab
```

## Usage

### Command Line

Run Context Grab using the following command:

```bash
yarn start <basePath> <filePath> <functionName>
```

- `basePath`: The root directory of your project
- `filePath`: Path to the file containing the target function
- `functionName`: Name of the function to extract

### Example

Given the following code structure:

```javascript
// app.ts
function testFunc() {
  const value = Service.testMethodFunc();
  console.log(value)
}

// service.ts
export class Service {
  static testMethodFunc() {
    return MyService.testMethodFuncNum()
  }

  static testMethodFuncNum() {
    return 1
  }
}
```

Running:

```bash
yarn start . ./app.ts testFunc
```

Will produce:

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

## Configuration

Create a `grab.json` file in your project root to customize Context Grab's behavior:

```json
{
  "type": "typescript",
  "aliasConfig": {
    "@utils": "./src/utils",
    "@components": "./src/components"
  },
  "includeImports": true,
  "depth": 4,
  "order": [
    "imports",
    "types",
    "classes",
    "functions"
  ],
  "prettier": {
    "semi": false,
    "singleQuote": true
  }
}
```

### Configuration Options

- `type`: Language type (`"javascript"` or `"typescript"`)
- `aliasConfig`: Path aliases for import resolution
- `includeImports`: Whether to include import statements
- `depth`: Maximum depth for context extraction (number of files to traverse)
- `order`: Preferred order of code elements in the output
- `prettier`: Prettier configuration for code formatting

## WebStorm Plugin

For an enhanced experience, use the Context Grabber plugin for WebStorm. It provides a seamless interface for using Context Grab directly within your IDE.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
