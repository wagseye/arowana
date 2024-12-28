import importSync from "import-sync";
import path from "path";

const MODULES_DIR = "node_modules";
const PACKAGE_FILE = "package.json";
const DEFAULT_MAIN = "index.js";

export default class CustomImport {
  public static async importSiblingModule(moduleName: string): Promise<object> {
    console.log("In importSiblingModule");
    const moduleDir = path.join(process.cwd(), MODULES_DIR, moduleName);
    const packageFile = path.join(moduleDir, PACKAGE_FILE);
    const packageContents = await import(packageFile, {
      assert: { type: "json" },
    });
    console.log("Loaded package contents: " + JSON.stringify(packageContents));
    const main = packageContents?.main || DEFAULT_MAIN;
    const fullImport = path.join(moduleDir, main);
    return await importSync(fullImport);
  }
}
