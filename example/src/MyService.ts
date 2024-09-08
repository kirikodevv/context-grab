import {UtilService} from "@/utils/UtilService";

export class MyService {

    static testMethodFunc() {
        return MyService.testMethodFuncNum() + UtilService.OtherNumberFunc()
    }

    static testMethodFuncNum() {
        return 1
    }

}
