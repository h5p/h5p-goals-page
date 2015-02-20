/** @namespace H5P */
var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * Grep Dialog Box module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage.GrepDialogBox = (function ($) {
/*  var IS_CURRICULUM = 0;
  var IS_COMPETENCE_AIM_SET = 1;
  var IS_COMPETENCE_AIM = 2;*/


  /**
   * Initialize module.
   * @param {Object} $wrapper Wrapper
   * @returns {Object} GrepDialogBox GrepDialogBox instance
   */
  function GrepDialogBox(jsonDataUrl) {
    this.$ = $;
    this.isCreated = false;
    this.jsonDataUrl = jsonDataUrl;
    this.curriculumNames = [];
  }

  /**
   * Creates the dialog box and attaches it to wrapper
   * @param {jQuery} $wrapper
   */
  GrepDialogBox.prototype.attach = function ($wrapper) {
    this.$wrapper = $wrapper;
    this.updateDialogView();
  };

  /**
   * Creates the dialog
   * @returns {H5P.GoalsPage.GrepDialogBox}
   */
  GrepDialogBox.prototype.createDialogView = function () {
    this.$curriculumDialog = $('<div>', {
      'class': 'h5p-curriculum-popup'
    });

    this.createHeader().appendTo(this.$curriculumDialog);

    this.$curriculumView = $('<div>', {
      'class': 'h5p-curriculum-view'
    }).appendTo(this.$curriculumDialog);

    this.isCreated = true;
    this.updateDialogView();

    this.$curriculumDialog.appendTo(this.$wrapper);

    return this;
  };

  /**
   * Creates header
   */
  GrepDialogBox.prototype.createHeader = function () {
    var $header = $('<div>', {
      'class': 'h5p-curriculum-header'
    });

    this.createSearchBox($header);
    this.createExit($header);

    return $header;
  };

  /**
   * Creates an exit button for the dialog box
   * @param $wrapper Creates button on this wrapper
   */
  GrepDialogBox.prototype.createExit = function ($wrapper) {
    var self = this;
    $('<div>', {
      'class': 'h5p-curriculum-popup-exit'
    }).click(function () {
      self.removeDialogBox();
    }).appendTo($wrapper);
  };

  /**
   * Removes the dialog box
   */
  GrepDialogBox.prototype.removeDialogBox = function () {
    this.$curriculumDialog.remove();
  };

  GrepDialogBox.prototype.updateDialogView = function (dataList) {
    // Create view popup if it does not exist
    if (!this.isCreated) {
      this.createDialogView();
    }

    var curriculumList = [];

    if (dataList !== undefined && dataList.length) {
      curriculumList = dataList;
    } else {
      //this.getCurriculumList();
    }

    // Extract curriculum instances from curriculums array
    var curriculumNamesList = this.getCurriculumNames(curriculumList);
    this.attachCurriculumsTo(curriculumNamesList, this.$curriculumView);

    return this;
  };

  GrepDialogBox.prototype.getCurriculumList = function (isCompetenceAimSet) {
    var curriculumList = [];

    // Default to getting all curriculums
    if (isCompetenceAimSet === undefined) {
      isCompetenceAimSet = false;
    }

    if (this.jsonData !== undefined && this.jsonData) {
      // get all curriculums
      if (this.jsonData.curriculums !== undefined && !isCompetenceAimSet) {
        curriculumList = this.jsonData.curriculums;
      } else if (this.jsonData.curriculum.competenceAimSets !== undefined && isCompetenceAimSet) {
        // get specific competwence aim set
        curriculumList = this.jsonData.curriculum.competenceAimSets;
      }
    }

    return curriculumList;
  };

  /**
   * Populates the curriculum names array with given curriculums
   * @param {Array} curriculums
   */
  GrepDialogBox.prototype.getCurriculumNames = function (curriculums) {
    var self = this;
    // Clear curriculum names array
    var curriculumNamesList = [];

    // Populate wrapper
    curriculums.forEach(function (curriculum, curriculumIndex) {
      var curriculumName = self.getLanguageNeutral(curriculum);
      curriculumNamesList.push({idx: curriculumIndex, value: curriculumName});
    });

    return curriculumNamesList;
  };

  GrepDialogBox.prototype.addBottomBar = function () {
    //TODO: Only add bottombar if selected goals are 1 or more.

    var self = this;
    if (self.$bottomBar === undefined) {
      self.$bottomBar = $('<div>', {
        'class': 'h5p-bottom-bar'
      }).appendTo(self.$curriculumDialog);

      self.$bottomBarText = $('<div>', {
        'class': 'h5p-bottom-bar-text',
        'html': '1 element chosen'
      }).appendTo(self.$bottomBar);

      self.$bottomBarButton = $('<div>', {
        'class': 'h5p-bottom-bar-button',
        'html': 'Done'
      }).click(function () {
        self.currentState = 0;
        self.$curriculumDialog.remove();
        self.$bottomBar.remove();
      }).appendTo(self.$bottomBar);

    }
/*    else {
      //UPDATE bottombar
      //self.$bottomBarText.html(self.selectedCompetenceAims.length + 'elements chosen');
    }*/
  };

  /**
   * Clears wrapper and attaches curriculums to it
   * @param {Array} curriculums Array of curriculum names
   * @param {jQuery} $wrapper Wrapper that curriculums will be appended to.
   * @param {String} filterString A filter for which curriculums to display
   * @returns {H5P.GoalsPage.GrepAPI}
   */
  GrepDialogBox.prototype.attachCurriculumsTo = function (curriculums, $wrapper, filterString) {
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
      }).appendTo($wrapper);
    });

    return this;
  };

  /**
   * Filters curriculums on string
   * @param {String} filterString Filter string
   * @returns {Array} filteredCurriculumNames Filtered curriculum names
   */
  GrepDialogBox.prototype.filterCurriculums = function (filterString) {
    var filteredCurriculumNames = [];
    this.curriculumNames.forEach(function (curriculumNameInstance) {
      // Check if filter string is a substring
      if (curriculumNameInstance.value.toLowerCase().indexOf(filterString.toLowerCase()) > -1) {
        filteredCurriculumNames.push({idx: curriculumNameInstance.idx, value: curriculumNameInstance.value});
      }
    });

    return filteredCurriculumNames;
  };

  /**
   * Creates a search box inside wrapper
   * @param {jQuery} $wrapper Search box appends to this wrapper
   * @returns {H5P.GoalsPage.GrepAPI}
   */
  GrepDialogBox.prototype.createSearchBox = function ($wrapper) {
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

  return GrepDialogBox;

}(H5P.jQuery));
