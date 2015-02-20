var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * GrepAPI module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage.GrepAPI = (function ($) {
  var IS_CURRICULUM = 0;
  var IS_COMPETENCE_AIM_SET = 1;
  var IS_COMPETENCE_AIM = 2;


  /**
   * Initialize module.
   * @param {Object} $wrapper Wrapper
   * @returns {Object} GrepAPI GrepAPI instance
   */
  function GrepAPI($wrapper, filterGoalsPlaceholder, targetGrepUrl) {
    this.$ = $(this);
    this.$wrapper = $wrapper;

    this.jsonData = [];
    this.curriculumNames = [];
    this.selectedCompetenceAims = [];

    this.currentCompetenceAimSet = 0;

    this.grepUrl = targetGrepUrl;
    if (this.grepUrl === undefined) {
      this.grepURL = 'http://mycurriculum.test.ndla.no/v1/users/ndla/curriculums';
    }

    // l10n
    this.filterGoalsPlaceholder = filterGoalsPlaceholder;
  }

  GrepAPI.prototype.getGrepData = function (jsonDataUrl, callbackFunction) {
    var self = this;

    if (jsonDataUrl === undefined) {
      jsonDataUrl = this.grepUrl;
    }

    $.ajax({
      url: this.grepURL,
      success: function (data) {
        self.jsonString = data;
        self.jsonData = JSON.parse(data);
      },
      error: function () {
        throw new Error("Cannot connect to the Internet.");
      },
      complete: function () {
        callbackFunction;
      }
    });

    return this;
  };

  GrepAPI.prototype.processSelection = function () {
    var self = this;
    var link = self.jsonData;
    if (self.currentState === self.IS_CURRICULUM) {
      link = link.curriculums[curriculumNameInstance.idx].link;
      self.getJson(link);
      self.currentState += 1;
    } else if (self.currentState === self.IS_COMPETENCE_AIM_SET) {
      this.currentCompetenceAimSet = curriculumNameInstance.idx;
      var competenceAims = link.curriculum.competenceAimSets[curriculumNameInstance.idx].competenceAimSets[0].competenceAims;
      self.currentState += 1;
      self.updateViewPopup(competenceAims);
    } else if (self.currentState === self.IS_COMPETENCE_AIM) {
      var selectedCompetenceAim = self.getLanguageNeutral(link.curriculum
        .competenceAimSets[self.currentCompetenceAimSet]
        .competenceAimSets[0]
        .competenceAims[curriculumNameInstance.idx]);
      self.addCompetenceAim(selectedCompetenceAim);
      self.addBottomBar();
    }
  };

  GrepAPI.prototype.addCompetenceAim = function (selectedCompetenceAim) {
    var self = this;
    if (self.selectedCompetenceAims.indexOf(selectedCompetenceAim) === -1) {
      self.selectedCompetenceAims.push(selectedCompetenceAim);
    }
  };

  /**
   * Get language neutral name for curriculum
   * @param {Object} curriculum Curriculum with name
   * @returns {string} curriculumName Language neutral curriculum name
   */
  GrepAPI.prototype.getLanguageNeutral = function (curriculum) {
    var curriculumName = '';
    curriculum.names.forEach(function (curriculumNameInstance) {
      if (curriculumNameInstance.isLanguageNeutral) {
        // Set curriculum name to language neutral name
        curriculumName = curriculumNameInstance.name;
      } else if (curriculumName === '') {
        // If there is no language neutral name, set curriculum name to available name
        curriculumName = curriculumNameInstance.name;
      }
    });

    return curriculumName;
  };

  return GrepAPI;

}(H5P.jQuery));
