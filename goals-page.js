var H5P = H5P || {};

/**
 * Goals Page module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage = (function ($) {
  // CSS Classes:
  var MAIN_CONTAINER = 'h5p-goals-page';

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
      defineGoalTitle: 'Create a new goal',
      defineGoalPlaceholder: 'Write here...',
      removeGoalTitle: 'Remove goal',
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
        '<div class="goals-define">' +
          '<div class="goals-search">{{chooseGoalText}}</div>' +
          '<div class="goals-create">{{defineGoalText}}</div>' +
        '</div>' +
        '<div class="goals-view"></div>';

    /*global Mustache */
    self.$inner.append(Mustache.render(goalsTemplate, self.params));
    self.$goalsView = $('.goals-view', self.$inner);

    self.createHelpTextButton();

    // Create predefined goal using GREP API
    $('.goals-search', self.$inner).click(function () {
      self.createGrepDialogBox(self.filteredIdList);
    });

    // Create new goal on click
    $('.goals-create', self.$inner).click(function () {
      var $newGoal = self.createNewGoal().appendTo(self.$goalsView);
      $('.created-goal', $newGoal).focus();
      var newGoal = new H5P.GoalsPage.GoalInstance(self.params.defineGoalPlaceholder, self.goalId);
      self.goalList.push(newGoal);
      self.goalId += 1;
    });
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

  GoalsPage.prototype.createGrepDialogBox = function (filteredIdString) {
    var self = this;
    var filteredIdList = self.getFilteredIdList(filteredIdString);

    var dialogInstance = new H5P.GoalsPage.GrepDialogBox(filteredIdList);
    dialogInstance.attach(self.$inner);
    dialogInstance.getFinishedButton().on('dialogFinished', function (event, data) {
      data.forEach(function (competenceAim) {
        self.createNewGoal(competenceAim).appendTo(self.$goalsView);
        var newGoal = new H5P.GoalsPage.GoalInstance(competenceAim, self.goalId);
        self.goalList.push(newGoal);
        self.goalId += 1;
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

    var initialText = '';
    if (predefinedGoalText !== undefined && predefinedGoalText.length) {
      initialText = predefinedGoalText;
    }

    // Goal container
    var $goalContainer = $('<div/>', {
      'class': 'created-goal-container'
    });

    // Input paragraph area
    $('<div/>', {
      'class': 'created-goal',
      'contentEditable': 'true',
      'spellcheck': 'false',
      'text': initialText
    }).focusout(function () {
      if ($(this).text() === '') {
        $(this).text(self.params.defineGoalPlaceholder);
      }
      self.goalList[$goalContainer.index()].goalText($(this).text());
    }).appendTo($goalContainer);

    // Remove button
    $('<div/>', {
      'class': 'created-goal-remove',
      'role': 'button',
      'title': self.params.removeGoalTitle
    }).click(function () {
      self.goalList.splice($goalContainer.index(), 1);
      $goalContainer.remove();
    }).appendTo($goalContainer);

    return $goalContainer;
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

  return GoalsPage;
}(H5P.jQuery));
