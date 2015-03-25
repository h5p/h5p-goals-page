var H5P = H5P || {};

/**
 * Goals Page module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage = (function ($) {
  // CSS Classes:
  var MAIN_CONTAINER = 'h5p-goals-page';

  // Goal states
  var GOAL_USER_CREATED = 0;
  var GOAL_PREDEFINED = 1;

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} GoalsPage GoalsPage instance
   */
  function GoalsPage(params, id) {
    this.$ = $(this);
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      title: 'Goals',
      description: '',
      chooseGoalText: 'Choose goal from list',
      defineGoalText: 'Create a new goal',
      defineGoalPlaceholder: 'Write here...',
      goalsAddedText: 'goals added',
      finishGoalText: 'Finish',
      editGoalText: 'Edit',
      removeGoalText: 'Remove',
      grepDialogDone: 'Done',
      filterGoalsPlaceholder: "Filter on words...",
      commaSeparatedCurriculumList: "",
      helpTextLabel: 'Read more',
      helpText: 'Help text'
    }, params);
  }

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  GoalsPage.prototype.attach = function ($container) {
    var self = this;
    this.$inner = $('<div>', {
      'class': MAIN_CONTAINER
    }).appendTo($container);

    self.goalList = [];
    self.goalId = 0;
    self.filteredIdList = [];

    var goalsTemplate =
        '<div class="goals-header">' +
        ' <div role="button" tabindex="1" class="goals-help-text">{{helpTextLabel}}</div>' +
        ' <div class="goals-title">{{title}}</div>' +
        '</div>' +
        '<div class="goals-description">{{description}}</div>' +
        '<div class="goals-define"></div>' +
        '<div class="goals-counter"></div>' +
        '<div class="goals-view"></div>';

    /*global Mustache */
    self.$inner.append(Mustache.render(goalsTemplate, self.params));
    self.$goalsView = $('.goals-view', self.$inner);

    self.createHelpTextButton();
    self.createGoalsButtons();
  };

  /**
   * Creates buttons for creating user defined and predefined goals
   */
  GoalsPage.prototype.createGoalsButtons = function () {
    var self = this;
    var $goalButtonsContainer = $('.goals-define', self.$inner);

    // Create predefined goal using GREP API
    H5P.JoubelUI.createSimpleRoundedButton(self.params.chooseGoalText)
      .addClass('goals-search')
      .click(function () {
        self.createGrepDialogBox(self.filteredIdList);
      }).appendTo($goalButtonsContainer);

    // Create new goal on click
    H5P.JoubelUI.createSimpleRoundedButton(self.params.defineGoalText)
      .addClass('goals-create')
      .click(function () {
        self.addGoal();
      }).appendTo($goalButtonsContainer);
  };

  /**
   * Adds a new goal to the page
   * @param {string} competenceAim Optional competence aim which the goal will constructed from
   */
  GoalsPage.prototype.addGoal = function (competenceAim) {
    var self = this;
    var goalText = self.params.defineGoalPlaceholder;
    var goalType = GOAL_USER_CREATED;
    var $newGoal = self.createNewGoal(competenceAim).appendTo(self.$goalsView);

    // Use predefined goal
    if (competenceAim !== undefined) {
      goalText = competenceAim;
      goalType = GOAL_PREDEFINED;
    }

    var newGoal = new H5P.GoalsPage.GoalInstance(goalText, self.goalId, goalType);
    $newGoal.removeClass()
      .addClass('created-goal-container')
      .addClass('goal-type-' + newGoal.getGoalInstanceType());

    // Set focus if new user defined goal
    if (competenceAim === undefined) {
      var $newGoalInput = $('.created-goal', $newGoal);
      $newGoal.addClass('focused');
      $newGoalInput.text(self.params.defineGoalPlaceholder);
      $newGoalInput.prop('contenteditable', true);
      $newGoalInput.focus();
    } else {
      // Truncate goal if it is not receiving focus
      $newGoal.addClass('truncate');
    }

    self.goalList.push(newGoal);
    self.goalId += 1;
    self.updateGoalsCounter();
  };

  /**
   * Remove chosen goal from the page
   * @param {jQuery} $goalContainer
   */
  GoalsPage.prototype.removeGoal = function ($goalContainer) {
    this.goalList.splice($goalContainer.index(), 1);
    $goalContainer.remove();
    this.updateGoalsCounter();
  };

  /**
   * Updates goal counter on page with amount of chosen goals.
   */
  GoalsPage.prototype.updateGoalsCounter = function () {
    var self = this;
    var $goalCounterContainer = $('.goals-counter', self.$inner);
    $goalCounterContainer.children().remove();
    if (self.goalList.length) {
      $('<span>', {
        'class': 'goals-counter-text',
        'html': self.goalList.length + ' ' + self.params.goalsAddedText
      }).appendTo($goalCounterContainer);
    }
  };

  /**
   * Create help text functionality for reading more about the task
   */
  GoalsPage.prototype.createHelpTextButton = function () {
    var self = this;

    if (this.params.helpText !== undefined && this.params.helpText.length) {
      $('.goals-help-text', this.$inner).click(function () {
        var $helpTextDialog = new H5P.JoubelUI.createHelpTextDialog(self.params.title, self.params.helpText);
        $helpTextDialog.appendTo(self.$inner.parent().parent().parent());
      });
    } else {
      $('.goals-help-text', this.$inner).remove();
    }
  };

  /**
   * Get lists with filtered ids
   * @returns {Array} filterIdList
   */
  GoalsPage.prototype.getFilteredIdList = function () {
    var filterIdList = [];
    if (this.params.commaSeparatedCurriculumList !== undefined
        && this.params.commaSeparatedCurriculumList.length) {
      filterIdList = this.params.commaSeparatedCurriculumList.split(',');
      filterIdList.forEach(function (filterId, filterIndex) {
        filterIdList[filterIndex] = filterId.trim();
      });
    }
    return filterIdList;
  };

  /**
   * Create grep dialog box
   * @param {String} filteredIdString
   */
  GoalsPage.prototype.createGrepDialogBox = function (filteredIdString) {
    var self = this;
    var filteredIdList = self.getFilteredIdList(filteredIdString);
    var dialogInstance = new H5P.GoalsPage.GrepDialogBox(this.params, filteredIdList);
    dialogInstance.attach(self.$inner.parent().parent().parent());
    dialogInstance.getFinishedButton().on('dialogFinished', function (event, data) {
      data.forEach(function (competenceAim) {
        self.addGoal(competenceAim);
      });
    });
  };

  /**
   * Create a new goal container
   *
   * @returns {jQuery} $goalContainer New goal
   */
  GoalsPage.prototype.createNewGoal = function (predefinedGoalText) {
    var self = this;

    // Goal container
    var $goalContainer = $('<div/>', {
      'class': 'created-goal-container'
    });

    var initialText = '';
    if (predefinedGoalText !== undefined && predefinedGoalText.length) {
      initialText = predefinedGoalText;
    }

    // Input paragraph area
    $('<div>', {
      'class': 'created-goal',
      'spellcheck': 'false',
      'contenteditable': false,
      'text': initialText
    }).appendTo($goalContainer);

    self.addCustomHoverEffects($goalContainer);

    return $goalContainer;
  };

  /**
   * Adds custom hover effects to provided goal container
   * @param {jQuery} $goalContainer Element that will get custom hover effects
   */
  GoalsPage.prototype.addCustomHoverEffects = function ($goalContainer) {
    var self = this;

    // Custom input footer
    var $inputFooter = $('<div>', {
      'class': 'h5p-created-goal-footer'
    });

    // Removes custom footer elements
    function removeFooter() {
      if ($inputFooter !== undefined) {
        $inputFooter.children().remove();
        $inputFooter.remove();
      }
    }

    // Creates custom editor footer
    function createEditFooter($goalContainer) {
      $inputFooter.appendTo($goalContainer);
      self.createRemoveGoalButton(self.params.removeGoalText, $goalContainer).appendTo($inputFooter);
      self.createFinishedGoalButton(self.params.finishGoalText).appendTo($inputFooter);
    }

    // Creates custom hover footer
    function createHoverFooter($goalContainer, $goalInputArea) {
      $inputFooter.appendTo($goalContainer);
      self.createRemoveGoalButton(self.params.removeGoalText, $goalContainer).appendTo($inputFooter);
      self.createEditGoalButton(self.params.editGoalText, $goalInputArea, removeFooter).appendTo($inputFooter);
    }

    var $goalInputArea = $('.created-goal', $goalContainer);

    // Add custom footer tools when input area is focused
    $goalInputArea.focus(function () {
      $(this).removeClass('truncate');
      createEditFooter($goalContainer);
      $goalContainer.addClass('focused');
    }).focusout(function () {
      $(this).addClass('truncate');
      $goalContainer.removeClass('focused');
      // Need to timeout before removing footer in case we are deleting the footer
      setTimeout(removeFooter, 150);
      if ($(this).text() === '') {
        $(this).text(self.params.defineGoalPlaceholder);
      }
      $(this).prop('contenteditable', false);
      self.goalList[$goalContainer.index()].goalText($(this).text());
    });

    // Add custom hover effects for the goal container
    $goalContainer.mouseenter(function () {
      if (!$goalInputArea.is(':focus')) {
        createHoverFooter($goalContainer, $goalInputArea);
      } else {
        $goalInputArea.removeClass('truncate');
      }
    }).mouseleave(function () {
      if (!$goalInputArea.is(':focus')) {
        removeFooter();
      } else {
        $(this).addClass('truncate');
      }
    });
  };

  /**
   * Creates a button for enabling editing the given goal
   * @param {String} text String to display on the button
   * @returns {jQuery} $editGoalButton The button
   */
  GoalsPage.prototype.createEditGoalButton = function (text, $inputGoal, removeFooterFunction) {
    var $editGoalButton = $('<div>', {
      'class': 'h5p-created-goal-edit',
      'role': 'button',
      'tabindex': 1,
      'text': text,
      'title': text
    }).click(function () {
      //Make goal editable and set focus to it
      removeFooterFunction();
      $inputGoal.prop('contenteditable', true);
      $inputGoal.focus();
    });

    return $editGoalButton;
  };

  /**
   * Creates a button for enabling editing the given goal
   * @param {String} text String to display on the button
   * @returns {jQuery} $editGoalButton The button
   */
  GoalsPage.prototype.createFinishedGoalButton = function (text) {
    var $editGoalButton = $('<div>', {
      'class': 'h5p-created-goal-done',
      'role': 'button',
      'tabindex': 1,
      'text': text,
      'title': text
    });

    return $editGoalButton;
  };

  /**
   * Creates a button for removing the given container
   * @param {String} text String to display on the button
   * @param {jQuery} $removeContainer Container that will be removed upon click
   * @returns {jQuery} $removeGoalButton The button
   */
  GoalsPage.prototype.createRemoveGoalButton = function (text, $removeContainer) {
    var self = this;
    var $removeGoalButton = $('<div>', {
      'class': 'h5p-created-goal-remove',
      'role': 'button',
      'tabindex': 1,
      'text': text,
      'title': text
    }).click(function () {
      self.removeGoal($removeContainer);
    });

    return $removeGoalButton;
  };

  /**
   * Get page title
   * @returns {String} Page title
   */
  GoalsPage.prototype.getTitle = function () {
    return this.params.title;
  };

  /**
   * Get goal list
   * @returns {Array} Goal list
   */
  GoalsPage.prototype.getGoals = function () {
    return this.goalList;
  };

  GoalsPage.prototype.resize = function () {

  };

  return GoalsPage;
}(H5P.jQuery));
