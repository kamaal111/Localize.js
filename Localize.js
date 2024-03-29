const fs = require('fs');

const { promises: asyncFS } = fs;

class Localize {
  localeDirectory;
  keysFilePath;
  locales;
  defaultLocale;
  indents = 2;
  keysTemplate = null;
  localeFileTemplate = null;

  constructor(
    localeDirectory = '.',
    keysFilePath,
    locales = {},
    defaultLocale,
    indents = 2,
  ) {
    this.localeDirectory = localeDirectory;
    this.locales = locales;
    this.keysFilePath = keysFilePath;
    this.indents = indents;

    if (defaultLocale != null) {
      this.defaultLocale = defaultLocale;
    } else {
      const localesKeys = Object.keys(locales);
      if (localesKeys.length > 0) {
        this.defaultLocale = localesKeys[0];
      }
    }
  }

  generateFiles = () => {
    return Promise.all(Object.keys(this.locales).map(this.#createLocaleFiles));
  };

  setKeysTemplate = (template) => {
    this.keysTemplate = template;
  };

  setLocaleFileTemplate = (template) => {
    this.localeFileTemplate = template;
  };

  #addStringIndents = (content, level) => {
    const filling = new Array(this.indents * (level * 2));
    return `${filling.fill(' ').join('')}${content}`;
  };

  #generateFileInput = (locale, returnKeysInput = false) => {
    const localeEntries = Object.entries(locale);

    let fileInput = '';
    let keysTemplateInput = '';
    for (let index = 0; index < localeEntries.length; index += 1) {
      const [key, translation] = localeEntries[index];
      fileInput += `"${key}" = "${translation}";\n`;

      if (!returnKeysInput) {
        continue;
      }

      const translationCase = this.#addStringIndents(`case ${key}`, 2);
      keysTemplateInput += `${translationCase}${
        index < localeEntries.length - 1 ? '\n' : ''
      }`;
    }

    return { fileInput, keysTemplateInput };
  };

  #appendPath = (original, pathExtension) => {
    if (original[original.length - 1] === '/') {
      return `${original}${pathExtension}`;
    }

    return `${original}/${pathExtension}`;
  };

  #createLocaleFiles = async (key) => {
    if (typeof this.keysFilePath != 'string') {
      throw new Error('No keysFilePath has been provided');
    }

    const locale = this.locales[key];
    const generateKeysInput = key === this.defaultLocale;
    let { fileInput: localizableFileInput, keysTemplateInput } =
      this.#generateFileInput(locale, generateKeysInput);

    if (generateKeysInput) {
      if (this.keysTemplate != null) {
        keysTemplateInput = this.keysTemplate(keysTemplateInput);
      }

      await asyncFS.writeFile(this.keysFilePath, keysTemplateInput);
    }

    const pathToLocalizableDirectory = this.#appendPath(
      this.localeDirectory,
      `${key}.lproj`,
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
}

module.exports = Localize;
