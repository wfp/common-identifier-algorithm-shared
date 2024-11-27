export { loadConfig } from './config/loadConfig.js';
export { makeConfigStore, ConfigStore } from './config/configStore.js';
export {
  generateHashesForDocument,
  preprocessFile,
  processFile,
  validateDocument,
} from './processing/index.js';
export { appDataLocation } from './config/utils.js';
export { CidDocument, SUPPORTED_FILE_TYPES } from './document.js';
export { makeValidationResultDocument } from './validation/index.js';
export { keepOutputColumns } from './processing/mapping.js'; 

export { joinFieldsForHash, cleanValueList, extractAlgoColumnsFromObject } from './hashing/utils.js';
export { BaseHasher } from './hashing/base.js';

export type { makeHasherFunction } from './hashing/base.js';
export type { Config } from './config/Config.js';
export type { Validation } from './validation/Validation.js';