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
    this.$inner = $container.addClass(MAIN_CONTAINER);

    self.goalList = [];
    self.goalId = 0;

    var goalsTemplate =
        '<div class="goals-title">{{title}}</div>' +
        '<div class="goals-description">{{description}}</div>' +
        '<div class="goals-define">' +
          '<div class="goals-search">{{chooseGoalText}}</div>' +
          '<div class="goals-create">{{defineGoalText}}</div>' +
        '</div>' +
        '<div class="goals-view"></div>';

    self.$inner.append(Mustache.render(goalsTemplate, self.params));


    var grepAPI = new H5P.GoalsPage.GrepAPI(self.$inner, self.params.filterGoalsPlaceholder);

    //TODO: will be implemented in a later case.
    // Create predefined goal using GREP API
    $('.goals-search', self.$inner).click(function (event) {
      //ndlaData.setDataCurriculum('uuid:2be0f347-d834-4e20-89a0-6f13bf10c0f9').getData();
      var dialogInstance = new H5P.GoalsPage.GrepDialogBox('test').attach(self.$inner);

      event.preventDefault();
    });

    // Create new goal on click
    $('.goals-create', self.$inner).click(function (event) {
      var $newGoal = self.createNewGoal().appendTo($('.goals-view', self.$inner));
      $('.created-goal', $newGoal).focus();
      var newGoal = new H5P.GoalsPage.GoalInstance(self.params.defineGoalPlaceholder, self.goalId);
      self.goalList.push(newGoal);
      self.goalId += 1;
      event.preventDefault();
    });
  };

  /**
   * Create a new goal container
   *
   * @returns {jQuery} $goalContainer New goal
   */
  GoalsPage.prototype.createNewGoal = function () {
    var self = this;

    // Goal container
    var $goalContainer = $('<div/>', {
      'class': 'created-goal-container'
    });

    // Input paragraph area
    $('<div/>', {
      'class': 'created-goal',
      'contentEditable': 'true',
      'spellcheck': 'false'
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
