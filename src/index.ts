import Parser from "./parser/parser.service";
import {extractArgs} from "./runner/args";

/*
TODO:

2. Can search by functions, classes, types, decorators
3. Experiment on more arbitrary things like files in root
4. Class Scoped Variables
5. Test: Controller in a nest or express project with max depth, can i get it all?


- Does it work with JS/Docstrings
- Framework test (Node, Express, NestJS)
- Frontend test (ReactJS/Angular)
- better unique identifiers
 */


const onRun = async () => {
  const { pathname, functionName, args } = extractArgs();

  const parser = new Parser(pathname, functionName, args);
  parser.getContext().finally(() => {
    console.log('Done')
  });
};

onRun();

