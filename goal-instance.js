var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * Goal Instance module
 */
H5P.GoalsPage.GoalInstance = (function () {

  /**
   * Initialize module.
   * @param {String} defineGoalPlaceholder Placeholder for Goal Instance
   * @param {Number} uniqueId Unique identifier for Goal Instance.
   * @returns {Object} GoalInstance GoalInstance instance
   */
  function GoalInstance(defineGoalPlaceholder, uniqueId, goalInstanceType) {
    this.uniqueId = uniqueId;
    this.answer = -1;
    this.text = defineGoalPlaceholder;
    this.goalInstanceType = goalInstanceType;
  }

  /**
   * Get goal instance type
   * @returns {Number} goalInstanceType 0 = user defined, 1 = predefined, 2 = edited predefined
   */
  GoalInstance.prototype.getGoalInstanceType = function () {
    return this.goalInstanceType;
  };

  /**
   * Get goal id
   * @returns {Number} uniqueId A unique identifier for the goal
   */
  GoalInstance.prototype.goalId = function () {
    return this.uniqueId;
  };

  /**
   * Set or get goal answer/assessment depending on provided parameter
   * @param {String} answer If defined the goal will be set to this value.
   * @returns {*} Returns answer with no parameters, and return this when setting parameter for chaining
   */
  GoalInstance.prototype.goalAnswer = function (answer) {
    // Get answer value if no arguments
    if (answer === undefined) {
      return this.answer;
    }

    // Set answer value
    this.answer = answer;
    return this;
  };

  /**
   * Get or set goal text depending on provided parameter
   * @param {String} text If defined this will be the new goal text for the goal
   * @returns {*} Returns text with no parameters, and return this when setting parameter for chaining
   */
  GoalInstance.prototype.goalText = function (text) {
    // Get text value if no arguments
    if (text === undefined) {
      return this.text;
    }

    // Set text value
    this.text = text;
    return this;
  };

  return GoalInstance;
}());
