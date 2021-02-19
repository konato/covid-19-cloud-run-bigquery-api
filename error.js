'use strict';

/**
 * Here is the base error classes to extend from
 */
class ApplicationError extends Error {
  /**
   * return the name of the class
   */
  get name() {
    return this.constructor.name;
  }
}

/**
 * ValidationError is used to report a parameter validation fail when
 * calling the api.
 */
class ValidationError extends ApplicationError {}

module.exports = {
  ApplicationError,
  ValidationError,
};
