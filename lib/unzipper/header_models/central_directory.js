import { CENTRAL_DIRECTORY_SIGNATURE } from "../constants.js"

// For version and extract_version:
/* 4.4.2.1 The upper byte indicates the compatibility of the file
  attribute information.  If the external file attributes
  are compatible with MS-DOS and can be read by PKZIP for
  DOS version 2.04g then this value will be zero.  If these
  attributes are not compatible, then this value will
  identify the host system on which the attributes are
  compatible.  Software can use this information to determine
  the line record format for text files etc. */
/* 4.4.2.3 The lower byte indicates the ZIP specification version
  (the version of this document) supported by the software
  used to encode the file.  The value/10 indicates the major
  version number, and the value mod 10 is the minor version
  number. */

export class CentralDirectory {
  static #VERSION_OFFSET = 4
  static #EXTRACT_VERSION_OFFSET = 6
  static #GENERAL_PURPOSE_BIT_FLAG_OFFSET = 8
  static #COMPRESSION_METHOD_OFFSET = 10
  static #FILE_LAST_MODIFICATION_TIME_OFFSET = 12
  static #FILE_LAST_MODIFICATION_DATE_OFFSET = 14
  static #CRC_OFFSET = 16
  static #COMPRESSED_SIZE_OFFSET = 20
  static #UNCOMPRESSED_SIZE_OFFSET = 24
  static #FILE_NAME_LENGTH_OFFSET = 28
  static #EXTRA_FIELD_LENGTH_OFFSET = 30
  static #FILE_COMMENT_LENGTH_OFFSET = 32
  static #DISK_NUMBER_OF_FILE_START_OFFSET = 34
  static #INTERNAL_FILE_ATTRIBUTES_OFFSET = 36
  static #EXTERNAL_FILE_ATTRIBUTES_OFFSET = 38
  static #LOCAL_FILE_HEADER_RELATIVE_OFFSET_OFFSET = 42
  static #FILE_NAME_OFFSET = 46
  static #CENTRAL_DIRECTORY_BASE_SIZE = 46
  #EXTRA_FIELD_OFFSET = -1
  #FILE_COMMENT_OFFSET = -1

  /**@type {Number} */
  #version
  /**@type {Number} */
  #extract_version
  /**@type {Number} */
  #general_purpose_bit_flag
  /**@type {Number} */
  #compression_method
  /**@type {Number} */
  #file_last_modification_time
  /**@type {Number} */
  #file_last_modification_date
  /**@type {Number} */
  #crc
  /**@type {Number} */
  #compressed_size
  /**@type {Number} */
  #uncompressed_size
  /**@type {Number} */
  #file_name_length
  /**@type {Number} */
  #extra_field_length
  /**@type {Number} */
  #file_comment_length
  /**@type {Number} */
  #disk_number_of_file_start
  /**@type {Number} */
  #internal_file_attributes
  /**@type {Number} */
  #external_file_attributes
  /**@type {Number} */
  #local_file_header_relative_offset
  /**@type {String} */
  #file_name
  /**@type {any} */
  #extra_field
  /**@type {String} */
  #file_comment
  /**@type {Number} */
  #start_offset
  /**@type {Number} */
  #size

  /**
   * @param {Buffer} buffer
   * @param {Number} start_offset
   */
  constructor(buffer, start_offset) {
    if (buffer.readUInt32LE(start_offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new EvalError("Central Directory signature does not match!")
    }

    this.#start_offset = start_offset
    const buf = buffer.slice(start_offset)

    this.#version = buf.readUInt16LE(CentralDirectory.#VERSION_OFFSET)
    this.#extract_version = buf.readUInt16LE(
      CentralDirectory.#EXTRACT_VERSION_OFFSET
    )
    this.#general_purpose_bit_flag = buf.readUInt16LE(
      CentralDirectory.#GENERAL_PURPOSE_BIT_FLAG_OFFSET
    )
    this.#compression_method = buf.readUInt16LE(
      CentralDirectory.#COMPRESSION_METHOD_OFFSET
    )
    this.#file_last_modification_time = buf.readUInt16LE(
      CentralDirectory.#FILE_LAST_MODIFICATION_TIME_OFFSET
    )
    this.#file_last_modification_date = buf.readUInt16LE(
      CentralDirectory.#FILE_LAST_MODIFICATION_DATE_OFFSET
    )
    this.#crc = buf.readUInt32LE(CentralDirectory.#CRC_OFFSET)
    this.#compressed_size = buf.readUInt32LE(
      CentralDirectory.#COMPRESSED_SIZE_OFFSET
    )
    this.#uncompressed_size = buf.readUInt32LE(
      CentralDirectory.#UNCOMPRESSED_SIZE_OFFSET
    )
    this.#file_name_length = buf.readUInt16LE(
      CentralDirectory.#FILE_NAME_LENGTH_OFFSET
    )

    this.#extra_field_length = buf.readUInt16LE(
      CentralDirectory.#EXTRA_FIELD_LENGTH_OFFSET
    )
    this.#file_comment_length = buf.readUInt16LE(
      CentralDirectory.#FILE_COMMENT_LENGTH_OFFSET
    )
    this.#disk_number_of_file_start = buf.readUInt16LE(
      CentralDirectory.#DISK_NUMBER_OF_FILE_START_OFFSET
    )
    this.#internal_file_attributes = buf.readUInt16LE(
      CentralDirectory.#INTERNAL_FILE_ATTRIBUTES_OFFSET
    )
    this.#external_file_attributes = buf.readUInt32LE(
      CentralDirectory.#EXTERNAL_FILE_ATTRIBUTES_OFFSET
    )
    this.#local_file_header_relative_offset = buf.readUInt32LE(
      CentralDirectory.#LOCAL_FILE_HEADER_RELATIVE_OFFSET_OFFSET
    )
    this.#file_name = buf.toString(
      "utf-8",
      CentralDirectory.#FILE_NAME_OFFSET,
      CentralDirectory.#FILE_NAME_OFFSET + this.#file_name_length
    )

    this.#EXTRA_FIELD_OFFSET =
      CentralDirectory.#FILE_NAME_OFFSET + this.#file_name_length

    this.#FILE_COMMENT_OFFSET =
      CentralDirectory.#FILE_NAME_OFFSET +
      this.#EXTRA_FIELD_OFFSET +
      this.#file_name_length

    this.#extra_field = buf.toString(
      "utf-8",
      this.#EXTRA_FIELD_OFFSET,
      this.#EXTRA_FIELD_OFFSET + this.#extra_field_length
    )
    this.#file_comment = buf.toString(
      "utf-8",
      this.#FILE_COMMENT_OFFSET,
      this.#FILE_COMMENT_OFFSET + this.#file_comment_length
    )

    this.#size =
      CentralDirectory.#CENTRAL_DIRECTORY_BASE_SIZE +
      this.#file_name_length +
      this.#extra_field_length +
      this.#file_comment_length
  }

  get version() {
    return this.#version
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

  get file_last_modified_time() {
    return this.#file_last_modification_time
  }

  get file_last_modified_date() {
    return this.#file_last_modification_date
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

  get file_comment_length() {
    return this.#file_comment_length
  }

  get disk_number_of_file_start() {
    return this.#disk_number_of_file_start
  }

  get internal_file_attributes() {
    return this.#internal_file_attributes
  }

  get external_file_attributes() {
    return this.#external_file_attributes
  }

  get local_file_header_relative_offset() {
    return this.#local_file_header_relative_offset
  }

  get file_name() {
    return this.#file_name
  }

  get extra_field() {
    return this.#extra_field
  }

  get file_comment() {
    return this.#file_comment
  }

  get start_offset() {
    return this.#start_offset
  }

  get size() {
    return this.#size
  }
}
