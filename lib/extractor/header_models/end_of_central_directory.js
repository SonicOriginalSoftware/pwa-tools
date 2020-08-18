export class EndOfCentralDirectory {
  // static #MAX_COMMENT_LENGTH = 0xffff
  static #THIS_DISK_NUMBER_OFFSET = 4
  static #CENTRAL_DIRECTORY_START_DISK_OFFSET = 6
  static #NUMBER_OF_CENTRAL_DIRECTORIES_ON_DISK_OFFSET = 8
  static #TOTAL_NUMBER_OF_CENTRAL_DIRECTORIES_OFFSET = 10
  static #SIZE_OF_CENTRAL_DIRECTORY_OFFSET = 12
  static #START_OF_CENTRAL_DIRECTORY_OFFSET = 16
  static #COMMENT_SIZE_OFFSET = 20
  static #COMMENT_START_OFFSET = 22

  /** @type {Buffer} */
  #buffer
  /** @type {Number} */
  #disk_number
  /** @type {Number} */
  #disk_of_central_directory_start
  /** @type {Number} */
  #number_of_central_directories_on_disk
  /** @type {Number} */
  #total_number_of_central_directories
  /** @type {Number} */
  #size_of_central_directory
  /** @type {Number} */
  #central_directory_start
  /** @type {String} */
  #comment

  /**
   * @param {Buffer} buffer
   * @param {Number} offset
   */
  constructor(buffer, offset) {
    this.#buffer = buffer.slice(offset)

    this.#disk_number = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#THIS_DISK_NUMBER_OFFSET
    )
    this.#disk_of_central_directory_start = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#CENTRAL_DIRECTORY_START_DISK_OFFSET
    )

    this.#number_of_central_directories_on_disk = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#NUMBER_OF_CENTRAL_DIRECTORIES_ON_DISK_OFFSET
    )

    this.#total_number_of_central_directories = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#TOTAL_NUMBER_OF_CENTRAL_DIRECTORIES_OFFSET
    )

    this.#size_of_central_directory = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#SIZE_OF_CENTRAL_DIRECTORY_OFFSET
    )

    this.#central_directory_start = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#START_OF_CENTRAL_DIRECTORY_OFFSET
    )

    const comment_length = this.#buffer.readUInt16LE(
      EndOfCentralDirectory.#COMMENT_SIZE_OFFSET
    )

    this.#comment = this.#buffer.toString(
      "utf-8",
      EndOfCentralDirectory.#COMMENT_START_OFFSET,
      comment_length
    )
  }

  get disk_number() {
    return this.#disk_number
  }

  get disk_of_central_directory_start() {
    return this.#disk_of_central_directory_start
  }

  get number_of_central_directories_on_disk() {
    return this.#number_of_central_directories_on_disk
  }

  get total_number_of_central_directories() {
    return this.#total_number_of_central_directories
  }

  get size_of_central_directory() {
    return this.#size_of_central_directory
  }

  get central_directory_start() {
    return this.#central_directory_start
  }

  get comment() {
    return this.#comment
  }
}
