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
    to_translate: string[];
    static: string[];
    reference: string[];
  }
  export interface Options {
    isBackup?: boolean;
    meta: {
      region: string;
      version: string;
    };
    messages?: {
      terms_and_conditions: string;
      error_in_config: string;
      error_in_salt: string;
    };
    source: ColumnMap;
    validations: { [key: string]: ColumnValidation[] };
    algorithm: {
      columns: AlgorithmColumns;
      hash: {
        strategy: 'SHA256' | 'SCRYPT' | 'ARGON2';
        num_iterations?: number;
        parallelism?: number;
        block_size?: number;
        size?: number;
      };
      salt: {
        source: 'FILE' | 'STRING';
        validator_regex: string;
        value:
          | {
              win32?: string;
              darwin?: string;
              linux?: string;
            }
          | string;
      };
    };
    destination: ColumnMap;
    destination_map: ColumnMap;
    destination_errors: ColumnMap;
    signature: {
      config_signature: string;
    };
  }
}

export interface AppConfigData {
  termsAndConditions: { [key: string]: boolean };
  window: {
    width: number;
    height: number;
  };
}
