export class LocalFile {
  static #LOCAL_FILE_SIGNATURE = 0x04034b50
  static #LOCAL_FILE_BASE_SIZE = 30
  static #EXTRACT_VERSION_OFFSET = 4
  static #GENERAL_PURPOSE_BIT_FLAG_OFFSET = 6
  static #COMPRESSION_METHOD_OFFSET = 8
  static #LAST_MOD_FILE_TIME_OFFSET = 10
  static #LAST_MOD_FILE_DATE_OFFSET = 12
  static #CRC_OFFSET = 14
  static #COMPRESSED_SIZE_OFFSET = 18
  static #UNCOMPRESSED_SIZE_OFFSET = 22
  static #FILE_NAME_LENGTH_OFFSET = 26
  static #EXTRA_FIELD_LENGTH_OFFSET = 28
  static #FILE_NAME_OFFSET = 30
  #EXTRA_FIELD_OFFSET = -1

  #extract_version
  #general_purpose_bit_flag
  #compression_method
  #last_mod_file_time
  #last_mod_file_date
  #crc
  #compressed_size
  #uncompressed_size
  #file_name_length
  #extra_field_length
  #file_name
  #extra_field
  /** @type {Number} */
  #start_offset
  /** @type {Number} */
  #size

  /**
   *
   * @param {Buffer} buffer
   * @param {Number} start_offset
   */
  constructor(buffer, start_offset) {
    if (buffer.readUInt32LE(start_offset) !== LocalFile.#LOCAL_FILE_SIGNATURE) {
      throw new EvalError("Central Directory signature does not match!")
    }

    this.#start_offset = start_offset
    const buf = buffer.slice(start_offset)

    this.#extract_version = buf.readUInt16LE(LocalFile.#EXTRACT_VERSION_OFFSET)
    this.#general_purpose_bit_flag = buf.readUInt16LE(
      LocalFile.#GENERAL_PURPOSE_BIT_FLAG_OFFSET
    )
    this.#compression_method = buf.readUInt16LE(
      LocalFile.#COMPRESSION_METHOD_OFFSET
    )
    this.#last_mod_file_time = buf.readUInt16LE(
      LocalFile.#LAST_MOD_FILE_TIME_OFFSET
    )
    this.#last_mod_file_date = buf.readUInt16LE(
      LocalFile.#LAST_MOD_FILE_DATE_OFFSET
    )
    this.#crc = buf.readUInt32LE(LocalFile.#CRC_OFFSET)
    this.#compressed_size = buf.readUInt32LE(LocalFile.#COMPRESSED_SIZE_OFFSET)
    this.#uncompressed_size = buf.readUInt32LE(
      LocalFile.#UNCOMPRESSED_SIZE_OFFSET
    )
    this.#file_name_length = buf.readUInt16LE(
      LocalFile.#FILE_NAME_LENGTH_OFFSET
    )

    this.#extra_field_length = buf.readUInt16LE(
      LocalFile.#EXTRA_FIELD_LENGTH_OFFSET
    )
    this.#file_name = buf.toString(
      "utf-8",
      LocalFile.#FILE_NAME_OFFSET,
      LocalFile.#FILE_NAME_OFFSET + this.#file_name_length
    )

    this.#EXTRA_FIELD_OFFSET =
      LocalFile.#FILE_NAME_OFFSET + this.#file_name_length

    this.#extra_field = buf.readUInt16LE(
      this.#file_name_length + LocalFile.#EXTRA_FIELD_LENGTH_OFFSET
    )

    this.#size =
      LocalFile.#LOCAL_FILE_BASE_SIZE +
      this.#file_name_length +
      this.#extra_field_length
  }

  get extract_version() {
    return this.#extract_version
  }

  get general_purpose_bit_flag() {
    return this.#general_purpose_bit_flag
  }

  get compression_method() {
    return this.#compression_method
  }

  get last_mod_file_time() {
    return this.#last_mod_file_time
  }

  get last_mod_file_date() {
    return this.#last_mod_file_date
  }

  get crc() {
    return this.#crc
  }

  get compressed_size() {
    return this.#compressed_size
  }

  get uncompressed_size() {
    return this.#uncompressed_size
  }

  get file_name_length() {
    return this.#file_name_length
  }

  get extra_field_length() {
    return this.#extra_field_length
  }

  get file_name() {
    return this.#file_name
  }

  get extra_field() {
    return this.#extra_field
  }

  get start_offset() {
    return this.#start_offset
  }

  get size() {
    return this.#size
  }
}
