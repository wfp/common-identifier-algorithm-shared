export namespace Config {
  export interface Column {
    name: string;
    alias: string;
    default?: string | number | string[] | number[];
  }
  export interface ColumnMap {
    columns: Column[];
    postfix?: string;
  }
  export interface ColumnValidation {
    op: string;
    value?: string | number | string[] | number[];
    message?: string;
    target?: string;
  }
  export interface AlgorithmColumns {
    process: string[];
    static: string[];
    reference: string[];
  }
  export type StringBasedSalt = { source: 'STRING'; value: string };
  export type FileBasedSalt = {
    source: 'FILE';
    validator_regex?: string;
    value: {
      win32?: string;
      darwin?: string;
      linux?: string;
    };
  };
  export interface Options {
    isBackup?: boolean;
    meta: {
      region: string;
      version: string;
      signature: string;
    };
    messages?: {
      terms_and_conditions: string;
      error_in_config: string;
      error_in_salt: string;
    };
    source: ColumnMap;
    validations?: { [key: string]: ColumnValidation[] };
    algorithm: {
      columns: AlgorithmColumns;
      hash: {
        strategy: 'SHA256';
      };
      salt: StringBasedSalt | FileBasedSalt;
    };
    destination: ColumnMap;
    destination_map: ColumnMap;
    destination_errors: ColumnMap;
  }
}

export interface AppConfigData {
  termsAndConditions: { [key: string]: boolean };
  window: {
    width: number;
    height: number;
  };
}
