import { closeDatabase, openDatabase } from "./index";

const handle = openDatabase({ migrate: true });
closeDatabase(handle);
