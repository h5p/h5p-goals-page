/** @namespace H5P */
var H5P = H5P || {};
H5P.GoalsPage = H5P.GoalsPage || {};

/**
 * Grep Dialog Box module
 * @class
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage.GrepDialogBox = (function ($) {
  var CURRICULUM = 0;
  var COMPETENCE_AIM_SET = 1;
  var COMPETENCE_AIM = 2;

  /**
   * Initialize module.
   * @param {Object} $wrapper Wrapper
   * @param {Array} competenceSetArray Array containing available competence set
   * @returns {Object} GrepDialogBox GrepDialogBox instance
   */
  function GrepDialogBox(header, filterIdList, filterGoalsPlaceholder) {
    this.$ = $;
    this.isCreated = false;
    this.hasBottomBar = false;
    this.selectedCompetenceAims = [];
    this.filteredIdList = filterIdList;
    this.header = header;

    // l10n
    this.filterGoalsPlaceholder = filterGoalsPlaceholder;
  }

  /**
   * Creates the dialog box and attaches it to wrapper
   * @param {jQuery} $wrapper
   */
  GrepDialogBox.prototype.attach = function ($wrapper) {
    this.$wrapper = $wrapper;
    // Get grep object
    this.grepApi = new H5P.GoalsPage.GrepAPI();
    this.createBottomBar();
    this.updateDialogView();
    this.grepApi.getGrepData(this, '', this.filteredIdList);
  };

  /**
   * Creates the dialog
   * @returns {H5P.GoalsPage.GrepDialogBox}
   */
  GrepDialogBox.prototype.createDialogView = function () {
    this.$curriculumDialogContainer = $('<div>', {
      'class': 'h5p-curriculum-popup-container'
    });

    // Create a semi-transparent background for the popup
    $('<div>', {
      'class': 'h5p-curriculum-popup-background'
    }).appendTo(this.$curriculumDialogContainer);

    this.$curriculumDialog = $('<div>', {
      'class': 'h5p-curriculum-popup'
    }).appendTo(this.$curriculumDialogContainer);

    this.createHeader().appendTo(this.$curriculumDialog);
    this.createSearchBox().appendTo(this.$curriculumDialog);

    this.$curriculumView = $('<div>', {
      'class': 'h5p-curriculum-view'
    }).appendTo(this.$curriculumDialog);

    this.isCreated = true;

    this.$curriculumDialogContainer.appendTo(this.$wrapper);

    return this;
  };

  /**
   * Creates header
   */
  GrepDialogBox.prototype.createHeader = function () {
    var $header = $('<div>', {
      'class': 'h5p-curriculum-header'
    });

    $('<div>', {
      'class': 'h5p-curriculum-header-text',
      'html': this.header
    }).appendTo($header);
    this.createExit().appendTo($header);

    return $header;
  };

  /**
   * Creates an exit button for the dialog box
   * @param $wrapper Creates button on this wrapper
   */
  GrepDialogBox.prototype.createExit = function () {
    var self = this;
    var $exitButton = $('<div>', {
      'class': 'h5p-curriculum-popup-exit'
    }).click(function () {
      self.removeDialogBox();
    });

    return $exitButton;
  };

  /**
   * Removes the dialog box
   */
  GrepDialogBox.prototype.removeDialogBox = function () {
    this.$curriculumDialogContainer.remove();
  };

  /**
   * Creates a throbber at the curriculum view.
   */
  GrepDialogBox.prototype.createLoadingScreen = function (selectedItem) {
    var self = this;
    if (!this.isCreated) {
      this.createDialogView();
    }

    var $throbberContainer = $('<div>', {
      'class': 'h5p-throbber-container'
    });

    // Append to curriculumView or to parent curriculum
    if (selectedItem !== undefined && selectedItem.type === CURRICULUM) {
      var selectedItemIndex = -1;
      // Find index of selected item
      self.curriculumNames.some(function (curriculumName, idx) {
        if (curriculumName.value === selectedItem.value) {
          selectedItemIndex = idx;
          return true;
        }
        return false;
      });
      if (selectedItemIndex > -1 && selectedItemIndex < self.curriculumNames.length) {
        $throbberContainer
          .addClass('right-aligned')
          .appendTo(self.$curriculumView.children().children().eq(selectedItemIndex));
      }
    } else {
      $throbberContainer.appendTo(self.$curriculumView);
    }

    // Create throbber
    var $throbber = new H5P.JoubelUI.createThrobber();
    $throbber.appendTo($throbberContainer);
  };

  /**
   * Updates the dialog box view
   * @param {Array} dataList List of data for updating the dialog box
   * @param {Number} dataListType Data type in dataList, 0 = curriculum, 1 = curriculum aim sets, 2 = competence aim
   * @returns {H5P.GoalsPage.GrepDialogBox}
   */
  GrepDialogBox.prototype.updateDialogView = function (dataList, dataListType) {
    // Create view popup if it does not exist
    if (!this.isCreated) {
      this.createDialogView();
    }

    var curriculumList = [];
    var dataNamesList = [];

    if (dataList !== undefined && dataList.length) {
      curriculumList = dataList;
    } else {
      this.grepApi.getDataList();
    }

    if (dataListType === CURRICULUM) {
      // Append competence aim sets to curriculums
      curriculumList = this.addCompetenceAimSet(dataList);
      dataNamesList = curriculumList;
    } else if (dataListType === COMPETENCE_AIM_SET) {
      curriculumList = this.addCompetenceAimList(dataList);
      dataNamesList = curriculumList;
    } else {
      dataNamesList = this.getDataNames(curriculumList);
    }

    // Extract curriculum instances from curriculums array
    this.curriculumNames = dataNamesList;
    this.updateViewList(this.$curriculumView, dataNamesList);


    return this;
  };

  /**
   * Gets the names from provided data list
   * @param {Array} dataList Contains names of data
   * @param {Boolean} isCompetenceAimSet Competence aim sets
   * @returns {Array} dataNamesList The provided data list with updated data objects
   */
  GrepDialogBox.prototype.getDataNames = function (dataList, isCompetenceAimSet) {
    var self = this;
    // Clear curriculum names array
    var dataNamesList = [];
    var dataType = isCompetenceAimSet ? COMPETENCE_AIM_SET : CURRICULUM;

    // Populate wrapper
    dataList.forEach(function (data, dataIndex) {
      var dataName = self.grepApi.getLanguageNeutral(data);
      dataNamesList.push({idx: dataIndex, value: dataName, type: dataType, child: data.link});
    });

    return dataNamesList;
  };

  /**
   * Adds a bottom bar to the dialog.
   */
  GrepDialogBox.prototype.createBottomBar = function () {
    var self = this;
    if (!this.hasBottomBar) {
      self.$bottomBar = $('<div>', {
        'class': 'h5p-bottom-bar'
      });

      self.$bottomBarText = $('<div>', {
        'class': 'h5p-bottom-bar-text',
        'html': '1 element chosen'
      }).appendTo(self.$bottomBar);

      self.$bottomBarButton = $('<button>', {
        'class': 'h5p-bottom-bar-button',
        'html': 'Done',
        'tabindex': '1'
      }).click(function () {
        $(this).trigger('dialogFinished', [self.selectedCompetenceAims]);
        self.removeDialogBox();
      }).appendTo(self.$bottomBar);
    }
  };

  /**
   * Updates bottom bar, either changing the text or remove the bottom bar.
   */
  GrepDialogBox.prototype.updateBottomBar = function () {
    var self = this;

    if (!this.hasBottomBar) {
      self.$bottomBar.appendTo(self.$curriculumDialog);
      this.hasBottomBar = true;
    }

    if (self.selectedCompetenceAims.length <= 0) {
      self.$bottomBarText.html('0 elements chosen');
    } else {
      var elementString = ' elements';
      if (self.selectedCompetenceAims.length === 1) {
        elementString = ' element';
      }
      self.$bottomBarText.html(self.selectedCompetenceAims.length + elementString + ' chosen');
    }
  };

  /**
   * Clears wrapper and attaches curriculums to it
   * @param {Array} curriculums Array of curriculum names
   * @param {jQuery} $wrapper Wrapper that curriculums will be appended to.
   * @param {String} filterString A filter for which curriculums to display
   * @returns {H5P.GoalsPage.GrepDialogBox}
   */
  GrepDialogBox.prototype.updateViewList = function ($wrapper, curriculums, filterString) {
    // Clear wrapper
    $wrapper.children().remove();
    this.createViewList(curriculums, filterString).appendTo($wrapper);

    return this;
  };

  /**
   * Creates the full list to display in dialog box from provided data
   * @param {Array} dataList Array containing all dialog box list data
   * @param filterString
   */
  GrepDialogBox.prototype.createViewList = function (dataList, filterString) {
    var self = this;
    if (filterString !== undefined && filterString) {
      dataList = self.filterDataList(filterString);
    }
    var $viewListContainer = $('<div>', {
      'class': 'h5p-view-list-container'
    });

    // Populate wrapper
    dataList.forEach(function (curriculumNameInstance) {
      var classString = '';
      switch (curriculumNameInstance.type) {
      case CURRICULUM:
        classString = 'h5p-view-list-entry h5p-curriculum-instance';
        break;
      case COMPETENCE_AIM_SET:
        classString = 'h5p-view-list-entry h5p-competence-aim-set-instance';
        break;
      case COMPETENCE_AIM:
        classString = 'h5p-view-list-entry h5p-competence-aim-instance';
        break;
      default:
        classString = 'h5p-view-list-entry';
      }

      $('<div>', {
        'class': classString,
        'text': curriculumNameInstance.value
      }).click(function () {
        self.handleListClick(curriculumNameInstance, $(this));
      }).appendTo($viewListContainer);
    });

    return $viewListContainer;
  };

  /**
   * Returns the button for finishing the dialog box
   * @returns {jQuery} this.$bottomBarButton Finish button
   */
  GrepDialogBox.prototype.getFinishedButton = function () {
    return this.$bottomBarButton;
  };

  /**
   * Adds competence aim to list of selected competence aims and updates bottom bar accordingly
   * @param {String} selectedCompetenceAim Textual representation of competence aim
   */
  GrepDialogBox.prototype.addCompetenceAim = function (selectedCompetenceAim, selectedElement) {
    var self = this;
    var competenceAimExists = false;
    self.selectedCompetenceAims.forEach(function (selectedAim) {
      if (selectedAim.text === selectedCompetenceAim) {
        competenceAimExists = true;
      }
    });
    if (!competenceAimExists) {
      var selectedCompetenceAimObject = {text: selectedCompetenceAim, curriculum: 'test'};
      self.selectedCompetenceAims.push(selectedCompetenceAimObject);
      // Add selected class
      selectedElement.addClass('selected');
    }

    this.updateBottomBar();
  };

  /**
   * Removes competence aim from selected competence aims list and updates bottom bar
   * @param {String} selectedCompetenceAim Textual representation of comeptence aim
   */
  GrepDialogBox.prototype.removeCompetenceAim = function (selectedCompetenceAim, selectedElement) {
    var self = this;
    debugger;
    var competenceAimIndex = -1;
    self.selectedCompetenceAims.forEach(function (selectedAim, selectedAimIndex) {
      if (selectedAim.text === selectedCompetenceAim) {
        competenceAimIndex = selectedAimIndex;
      }
    });
    if (competenceAimIndex > -1) {
      this.selectedCompetenceAims.slice(competenceAimIndex, 1);
      selectedElement.removeClass('selected');
    }
    this.updateBottomBar();
  };

  /**
   * Process selected item in dialog box
   * @param {Object} selectedItem Selected item
   */
  GrepDialogBox.prototype.processSelection = function (selectedItem, selectedElement) {
    if (selectedItem.type === CURRICULUM) {
      this.grepApi.getGrepData(this, selectedItem);
    } else if (selectedItem.type === COMPETENCE_AIM_SET) {
      this.updateDialogView(selectedItem.competenceAims, selectedItem.type);
    } else if (selectedItem.type === COMPETENCE_AIM) {
      this.addCompetenceAim(selectedItem.value, selectedElement);
    }
  };

  GrepDialogBox.prototype.handleListClick = function (parent, parentElement) {
    var parentIndex = this.curriculumNames.indexOf(parent);
    var parentObject = parent;
    var childIndex = parentIndex + 1;
    var childObject = this.curriculumNames[childIndex];
    var competenceAimExists = false;

    // Check if a it is a competence aim and already is selected
    if (parentObject.type === COMPETENCE_AIM) {
      this.selectedCompetenceAims.forEach(function (selectedAim) {
        if (selectedAim === parentObject) {
          competenceAimExists = true;
        }
      });
    }

    if (childObject !== undefined
        && parentObject.type < childObject.type
        && parentObject.type !== COMPETENCE_AIM) {
      this.collapseListItem(parent);
    } else if (competenceAimExists) {
      // Remove competence aim if it already exists
      this.removeCompetenceAim(parentObject, parentElement);
    } else {
      this.processSelection(parent, parentElement);
    }
  };

  /**
   * Collapses a listitem and its' children
   * @param {Object} parent Listitem
   */
  GrepDialogBox.prototype.collapseListItem = function (parent) {
    var parentIndex = this.curriculumNames.indexOf(parent);
    var childIndex = parentIndex + 1;
    var removeCounter = 0;

    if (parentIndex >= 0) {
      while (childIndex < this.curriculumNames.length
          && this.curriculumNames[childIndex].type > this.curriculumNames[parentIndex].type) {
        removeCounter += 1;
        childIndex += 1;
      }
      this.curriculumNames.splice(parentIndex + 1, removeCounter);
    }
    this.updateViewList(this.$curriculumView, this.curriculumNames, this.$searchInput.val());
  };


  /**
   * Merges competence aim set into curriculum list
   * @param {Array} curriculumList Original list containing curriculums
   * @param {Array} competenceAimSet Competence aims added to curriculum list
   * @returns {Array} mergedList Merged list
   */
  GrepDialogBox.prototype.addCompetenceAimSet = function (competenceAimSet) {
    // Appends the data provided to the corresponding parent element existing in the dialog.
    var mergedList = [];
    var self = this;

    // Match link to appropriate parent
    this.curriculumNames.forEach(function (curriculumName) {
      mergedList.push(curriculumName);
      if (curriculumName.child === competenceAimSet[0].links.parent) {
        // Append list under parent
        competenceAimSet.forEach(function (competenceAimSetInstance, instanceIndex) {
          var instanceName = self.grepApi.getLanguageNeutral(competenceAimSetInstance);
          mergedList.push({
            idx: instanceIndex,
            type: curriculumName.type + 1,
            value: instanceName,
            parent: curriculumName,
            competenceAims: competenceAimSetInstance.competenceAims
          });
        });
      }
    });

    return mergedList;
  };

  GrepDialogBox.prototype.addCompetenceAimList = function (competenceAimList) {
    var mergedList = [];
    var self = this;

    this.curriculumNames.forEach(function (curriculumName) {
      mergedList.push(curriculumName);
      if (curriculumName.competenceAims !== undefined && curriculumName.competenceAims.length) {
        if (curriculumName.competenceAims[0] === competenceAimList[0]) {
          // Append list under parent
          competenceAimList.forEach(function (competenceAimInstance, instanceIndex) {
            var instanceName = self.grepApi.getLanguageNeutral(competenceAimInstance);
            mergedList.push({
              idx: instanceIndex,
              type: curriculumName.type + 1,
              value: instanceName,
              parent: curriculumName
            });
          });
        }
      }
    });

    return mergedList;
  };

  /**
   * Filters curriculums on string
   * @param {String} filterString Filter string
   * @returns {Array} filteredCurriculumNames Filtered curriculum names
   */
  GrepDialogBox.prototype.filterDataList = function (filterString) {
    var filteredCurriculumNames = [];
    this.curriculumNames.forEach(function (curriculumNameInstance) {
      // Check if filter string is a substring
      if (curriculumNameInstance.value.toLowerCase().indexOf(filterString.toLowerCase()) > -1) {
        filteredCurriculumNames.push(curriculumNameInstance);
      }
    });

    return filteredCurriculumNames;
  };

  /**
   * Creates a search box inside wrapper
   * @param {jQuery} $wrapper Search box appends to this wrapper
   * @returns {H5P.GoalsPage.GrepAPI}
   */
  GrepDialogBox.prototype.createSearchBox = function () {
    var self = this;

    var $searchContainter = $('<div>', {
      'class': 'h5p-curriculum-search-container'
    });

    this.$searchInput = $('<input>', {
      'type': 'text',
      'class': 'h5p-curriculum-search-box',
      'placeholder': this.filterGoalsPlaceholder
    }).keyup(function () {
      // Filter curriculum names on key up
      var input = $(this).val();
      self.updateViewList(self.$curriculumView, self.curriculumNames, input);
    }).appendTo($searchContainter);

    return $searchContainter;
  };

  return GrepDialogBox;

}(H5P.jQuery));
