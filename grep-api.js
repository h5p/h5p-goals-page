var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * GrepAPI module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage.GrepAPI = (function ($) {

  /**
   * Initialize module.
   * @param {Object} $wrapper Wrapper
   * @returns {Object} GrepAPI GrepAPI instance
   */
  function GrepAPI($wrapper, filterGoalsPlaceholder) {
    this.$ = $(this);
    this.$wrapper = $wrapper;
    this.jsonString = '';
    this.jsonData = [];
    this.curriculumNames = [];
    this.curriculumIsSelected = false;
    this.grepURL = 'http://mycurriculum.test.ndla.no/v1/users/ndla/curriculums';
    this.selectedCompetenceAims = [];
    this.currentCompetenceAimSet = 0;

    this.IS_CURRICULUM = 0;
    this.IS_COMPETENCE_AIM_SET = 1;
    this.IS_COMPETENCE_AIM = 2;

    this.currentState = this.IS_CURRICULUM;

    // l10n
    this.filterGoalsPlaceholder = filterGoalsPlaceholder;
  }

  /**
   * Set the data that will be retrieved to specified uuid
   *
   * @param {String} uuid uuid of curriculum
   * @returns {GrepAPI} GrepAPI Returns GrepAPI for chaining.
   */
  GrepAPI.prototype.setDataCurriculum = function (uuid) {
    var slicedUuid = uuid;
    if (uuid.substring(0, 4) === "uuid") {
      slicedUuid = uuid.slice(4);
    }

    this.service_data = {
      "method" : "get.curriculum",
      "laereplan_id" : "uuid:" + slicedUuid,
      "format" : "json",
      "language" : "nb"
    };

    return this;
  };

  GrepAPI.prototype.getJson = function (link) {
    var self = this;

    var curriculumURL = link;

    $.ajax({
      url: curriculumURL,
      success: function (data) {
        self.jsonString = data;
        self.jsonData = JSON.parse(data);
      },
      error: function () {
        throw new Error("Cannot connect to the Internet.");
      },
      complete: function () {
        self.updateViewPopup();
      }
    });

    return this;
  };

  GrepAPI.prototype.getData = function () {
    var self = this;

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
        self.createViewPopup();
      }
    });

    return this;
  };

  GrepAPI.prototype.updateViewPopup = function (competenceAims) {
    if (this.jsonData !== undefined && this.jsonData) {
      var curriculums = this.jsonData.curriculums;

      if (this.currentState === this.IS_COMPETENCE_AIM_SET) {
        curriculums = this.jsonData.curriculum.competenceAimSets;
      }

      if (competenceAims !== undefined && competenceAims) {
        curriculums = competenceAims;
      }

      // Extract curriculum instances from curriculums array
      this.populateCurriculumNames(curriculums);
      this.attachCurriculumsTo(this.curriculumNames, this.$curriculumView);
    }

    return this;
  };

  GrepAPI.prototype.createViewPopup = function () {
    this.$curriculumPopup = $('<div>', {
      'class': 'h5p-curriculum-popup'
    });

    this.createSearchBox(this.$curriculumPopup);

    this.$curriculumView = $('<div>', {
      'class': 'h5p-curriculum-view'
    }).appendTo(this.$curriculumPopup);

    this.updateViewPopup();

    this.$curriculumPopup.appendTo(this.$wrapper);

    return this;
  };

  /**
   * Creates a search box inside wrapper
   * @param {jQuery} $wrapper Search box appends to this wrapper
   * @returns {H5P.GoalsPage.GrepAPI}
   */
  GrepAPI.prototype.createSearchBox = function ($wrapper) {
    var self = this;

    var $searchContainter = $('<div>', {
      'class': 'h5p-curriculum-search-container'
    }).appendTo($wrapper);

    $('<input>', {
      'type': 'text',
      'class': 'h5p-curriculum-search-box',
      'placeholder': this.filterGoalsPlaceholder
    }).keyup(function () {
      // Filter curriculum names on key up
      var input = $(this).val();
      self.attachCurriculumsTo(self.curriculumNames, self.$curriculumView, input);
    }).appendTo($searchContainter);

    return this;
  };

  /**
   * Filters curriculums on string
   * @param {String} filterString Filter string
   * @returns {Array} filteredCurriculumNames Filtered curriculum names
   */
  GrepAPI.prototype.filterCurriculums = function (filterString) {
    var filteredCurriculumNames = [];
    this.curriculumNames.forEach(function (curriculumNameInstance) {
      if (curriculumNameInstance.value.indexOf(filterString) > -1) {
        filteredCurriculumNames.push({idx: curriculumNameInstance.idx, value: curriculumNameInstance.value});
      }
    });

    return filteredCurriculumNames;
  };

  /**
   * Clears wrapper and attaches curriculums to it
   * @param {Array} curriculums Array of curriculum names
   * @param {jQuery} $wrapper Wrapper that curriculums will be appended to.
   * @param {String} filterString A filter for which curriculums to display
   * @returns {H5P.GoalsPage.GrepAPI}
   */
  GrepAPI.prototype.attachCurriculumsTo = function (curriculums, $wrapper, filterString) {
    var self = this;
    // Clear wrapper
    $wrapper.children().remove();

    if (filterString !== undefined && filterString) {
      curriculums = self.filterCurriculums(filterString);
    }

    // Populate wrapper
    curriculums.forEach(function (curriculumNameInstance) {
      $('<div>', {
        'class': 'h5p-curriculum-instance',
        'text': curriculumNameInstance.value
      }).click(function () {
        self.curriculumIsSelected = true;
        //TODO: make own function for processing jsondata relative to current state
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

      }).appendTo($wrapper);
    });

    return this;
  };

  GrepAPI.prototype.addBottomBar = function () {
    var self = this;
    if (self.$bottomBar === undefined) {
      self.$bottomBar = $('<div>', {
        'class': 'h5p-bottom-bar'
      }).appendTo(self.$curriculumPopup);

      self.$bottomBarText = $('<div>', {
        'class': 'h5p-bottom-bar-text',
        'html': '1 element chosen'
      }).appendTo(self.$bottomBar);

      self.$bottomBarButton = $('<div>', {
        'class': 'h5p-bottom-bar-button',
        'html': 'Done'
      }).click(function () {
        self.currentState = 0;
        self.$curriculumPopup.remove();
        self.$bottomBar.remove();
      }).appendTo(self.$bottomBar);

    } else {
      //UPDATE bottombar
      self.$bottomBarText.html(self.selectedCompetenceAims.length + 'elements chosen');
    }

  };

  GrepAPI.prototype.addCompetenceAim = function (selectedCompetenceAim) {
    var self = this;
    if (self.selectedCompetenceAims.indexOf(selectedCompetenceAim) === -1) {
      self.selectedCompetenceAims.push(selectedCompetenceAim);
    }
  };

  /**
   * Populates the curriculum names array with given curriculums
   * @param {Array} curriculums
   */
  GrepAPI.prototype.populateCurriculumNames = function (curriculums) {
    var self = this;
    // Clear curriculum names array
    this.curriculumNames = [];

    // Populate wrapper
    curriculums.forEach(function (curriculum, curriculumIndex) {
      var curriculumName = self.getLanguageNeutral(curriculum);
      self.curriculumNames.push({idx: curriculumIndex, value: curriculumName});
    });

    return this;
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

})(H5P.jQuery);
