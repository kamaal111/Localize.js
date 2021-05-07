const fs = require("fs");

const { promises: asyncFS } = fs;

class Localize {
  localeDirectory = ".";
  keysFilePath;
  locales;
  defaultLocale;
  keysTemplate = null;
  localeFileTemplate = null;

  constructor(localeDirectory, keysFilePath, locales = {}, defaultLocale) {
    this.localeDirectory = localeDirectory;
    this.locales = locales;
    this.keysFilePath = keysFilePath;
    if (defaultLocale != null) {
      this.defaultLocale = defaultLocale;
    } else {
      const localesKeys = Object.keys(locales);
      if (localesKeys.length > 0) {
        this.defaultLocale = localesKeys[0];
      }
    }
  }

  setKeysTemplate = (template) => {
    this.keysTemplate = template;
  };

  setLocaleFileTemplate = (template) => {
    this.localeFileTemplate = template;
  };

  #generateFileInput = (locale, returnKeysInput = false) => {
    const localeEntries = Object.entries(locale);
    let fileInput = "";
    let keysTemplateInput = "";
    for (let index = 0; index < localeEntries.length; index++) {
      const [key, translation] = localeEntries[index];
      fileInput += `"${key}" = "${translation}";`;
      if (returnKeysInput) {
        keysTemplateInput += `case ${key}${
          index < localeEntries.length - 1 ? "\n" : ""
        }`;
      }
    }
    return { fileInput, keysTemplateInput };
  };

  #appendPath = (original, pathExtension) => {
    if (original[original.length - 1] === "/") {
      return `${original}${pathExtension}`;
    }
    return `${original}/${pathExtension}`;
  };

  #createLocaleFiles = async (key) => {
    if (typeof this.keysFilePath != "string") {
      throw "No keysFilePath has been provided";
    }
    const locale = this.locales[key];
    const generateKeysInput = key === this.defaultLocale;
    let {
      fileInput: localizableFileInput,
      keysTemplateInput,
    } = this.#generateFileInput(locale, generateKeysInput);
    if (generateKeysInput) {
      if (this.keysTemplate != null) {
        keysTemplateInput = this.keysTemplate(keysTemplateInput);
      }
      await asyncFS.writeFile(this.keysFilePath, keysTemplateInput);
    }
    const pathToLocalizableDirectory = this.#appendPath(
      this.localeDirectory,
      `${key}.lproj`
    );
    if (!fs.existsSync(pathToLocalizableDirectory)) {
      await asyncFS.mkdir(pathToLocalizableDirectory);
    }
    const pathToLocalizableFile = `${pathToLocalizableDirectory}/Localizable.strings`;
    if (this.localeFileTemplate != null) {
      localizableFileInput = this.localeFileTemplate(localizableFileInput);
    }
    await asyncFS.writeFile(pathToLocalizableFile, localizableFileInput);
  };

  generateFiles = () => {
    return Promise.all(Object.keys(this.locales).map(this.#createLocaleFiles));
  };
}

module.exports = Localize;
