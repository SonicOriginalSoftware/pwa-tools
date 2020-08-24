import { inflateRaw } from "zlib"

import { COMPRESION_METHOD } from "../constants.js"

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

  /** @type {Number} */
  #extract_version
  /** @type {Number} */
  #general_purpose_bit_flag
  /** @type {Number} */
  #compression_method
  /** @type {Number} */
  #last_mod_file_time
  /** @type {Number} */
  #last_mod_file_date
  /** @type {Number} */
  #crc
  /** @type {Number} */
  #compressed_size
  /** @type {Number} */
  #uncompressed_size
  /** @type {Number} */
  #file_name_length
  /** @type {Number} */
  #extra_field_length
  /** @type {String} */
  #file_name
  /** @type {Number} */
  #extra_field
  /** @type {Number} */
  #start_offset
  /** @type {Number} */
  #size
  /** @type {Buffer} */
  #raw_buffer

  /**
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
      this.#file_name_length + this.#EXTRA_FIELD_OFFSET
    )

    this.#size =
      LocalFile.#LOCAL_FILE_BASE_SIZE +
      this.#file_name_length +
      this.#extra_field_length

    const raw_buffer_start = start_offset + this.#size
    this.#raw_buffer = buffer.slice(
      raw_buffer_start,
      raw_buffer_start + this.#compressed_size
    )
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

  /** @returns {Promise<Buffer>} */
  get content() {
    switch (this.#compression_method) {
      case COMPRESION_METHOD.DEFLATED:
        return new Promise((resolve, reject) =>
          inflateRaw(this.#raw_buffer, (err, decompressed_buffer) =>
            err ? reject(err) : resolve(decompressed_buffer)
          )
        )
    }
    return Promise.resolve(this.#raw_buffer)
  }
}
