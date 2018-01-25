var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * Generate xAPI statements
 */
H5P.GoalsPage.xApiGenerator = (function () {

  function xApiGenerator(question) {
    // Set up default response object
    this.event = {
      description: {
        'en-US': question // We don't actually know the language of the question
      },
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      interactionType: 'fill-in',
    };
  }

  xApiGenerator.prototype.constructor = xApiGenerator;

  /**
   * Extend xAPI template
   * @param {H5P.XAPIEvent} xApiTemplate xAPI event template
   * @param {string} answer Answer to open ended question
   * @return {H5P.XAPIEvent} Extended xAPI event
   */
  xApiGenerator.prototype.generateXApi = function (xApiTemplate, answer) {
    const statement = xApiTemplate.data.statement;
    Object.assign(statement, {
      result: {
        response: answer
      }
    });

    if (statement.object) {
      const definition = statement.object.definition;
      Object.assign(definition, this.event);
    }

    return xApiTemplate;
  };

  return xApiGenerator;
})();
