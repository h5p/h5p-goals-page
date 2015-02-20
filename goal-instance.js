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
  function GoalInstance(defineGoalPlaceholder, uniqueId) {
    this.uniqueId = uniqueId;
    this.answer = -1;
    this.text = defineGoalPlaceholder;
  }

  GoalInstance.prototype.goalId = function () {
    return this.uniqueId;
  };

  GoalInstance.prototype.goalAnswer = function (answer) {
    // Get answer value if no arguments
    if (answer === undefined) {
      return this.answer;
    }

    // Set answer value
    this.answer = answer;
    return this;
  };

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
