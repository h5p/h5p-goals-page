// eslint-disable-next-line no-var
var H5P = H5P || {};

/**
 * Goals Page module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsPage = (function ($, EventDispatcher) {
  // CSS Classes:
  const MAIN_CONTAINER = 'h5p-goals-page h5p-theme';

  let goalCounter = 0;

  /**
   * Helper for resizing height of text area while typing (to avoid scrollbars)
   *
   * @param  {H5P.jQuery} $textarea
   */
  const autoResizeTextarea = function ($textarea) {
    const setHeight = function () {
      $textarea.css('height', `${Math.max($textarea[0].scrollHeight, 50)}px`);
    };

    $textarea.on('input', function () {
      this.style.height = 'auto';
      setHeight();
    });

    setHeight();
  };

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @param {object} [extras] Saved state, metadata, etc.
   * @returns {Object} GoalsPage GoalsPage instance
   */
  function GoalsPage(params, id, extras) {
    EventDispatcher.call(this);
    this.id = id;
    this.extras = extras;

    // Set default behavior.
    this.params = $.extend({
      title: this.getTitle(),
      a11yFriendlyTitle: this.getTitle(false),
      description: '',
      defineGoalText: 'Create a new goal',
      definedGoalLabel: 'User defined goal',
      defineGoalPlaceholder: 'Write here...',
      goalsAddedText: 'Number of goals added:',
      removeGoalText: 'Remove Goal',
      helpTextLabel: 'Read more',
      helpText: 'Help text',
      goalDeletionConfirmation: {
        header: 'Confirm deletion',
        message: 'Are you sure you want to delete this goal?',
        cancelLabel: 'Cancel',
        confirmLabel: 'Confirm',
      },
    }, params);

    if (extras !== undefined && extras.previousState !== null && typeof extras.previousState === 'object' && Object.keys(extras.previousState).length) {
      this.previousState = extras.previousState;
    }
  }

  GoalsPage.prototype = Object.create(EventDispatcher.prototype);
  GoalsPage.prototype.constructor = GoalsPage;

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  GoalsPage.prototype.attach = function ($container) {
    const self = this;
    this.$inner = $('<div>', {
      class: MAIN_CONTAINER,
    }).appendTo($container);

    self.goalList = [];
    self.goalId = 0;

    self.$pageTitle = $('<li>', {
      class: 'page-header',
      role: 'heading',
      tabindex: '-1',
      'aria-label': self.params.a11yFriendlyTitle,
      append: $('<div>', {
        class: 'page-title',
        html: self.params.title,
      }),
      appendTo: self.$inner,
    });

    if (self.params.helpText !== undefined && self.params.helpText.length !== 0) {
      self.$helpButton = $('<button>', {
        class: 'page-help-text',
        'aria-label': self.params.helpTextLabel,
        click() {
          self.trigger('open-help-dialog', {
            title: self.params.title,
            helpText: self.params.helpText,
          });
        },
        appendTo: self.$pageTitle,
      });
      H5P.Tooltip(self.$helpButton[0]);
    }

    $('<div>', {
      class: 'goals-description',
      html: self.params.description,
      appendTo: self.$inner,
    });

    self.$goalsView = $('<div>', {
      class: 'goals-view',
      appendTo: self.$inner,
    });

    $('<div>', {
      class: 'goals-counter',
      appendTo: self.$inner,
    });

    const $goalsDefine = $('<div>', {
      class: 'goals-define',
      appendTo: self.$inner,
    });

    this.createGoalButton = H5P.Components.Button({
      label: this.params.defineGoalText,
      icon: 'goals-create',
      onClick: () => {
        self.addGoal().find('.created-goal').focus();
        self.trigger('resize');
      },
    });

    $goalsDefine[0].appendChild(this.createGoalButton);

    if (this.previousState && this.previousState.goals) {
      // Recreate goals
      this.previousState.goals.forEach((goal, index) => {
        self.addGoal({
          value: goal.text,
          description: goal.goalTypeDescription,
        });
        self.goalList[index].goalAnswer(goal.answer);
        self.goalList[index].setTextualAnswer(goal.textualAnswer);
      });
    }
  };

  /**
   * Adds a new goal to the page
   * @param {Object} competenceAim Optional competence aim which the goal will constructed from
   * @return {jQuery} $newGoal New goal element
   */
  GoalsPage.prototype.addGoal = function (competenceAim) {
    const self = this;
    goalCounter++;

    const goalPlaceholder = this.htmlDecode(self.params.defineGoalPlaceholder);
    let goalTypeDescription = this.htmlDecode(self.params.definedGoalLabel);
    let goalText;

    // Use predefined goal
    if (competenceAim !== undefined) {
      goalText = competenceAim.value;
      goalTypeDescription = competenceAim.description;
    }

    const newGoal = new H5P.GoalsPage.GoalInstance(goalPlaceholder, self.goalId, goalTypeDescription, goalText);
    self.goalList.push(newGoal);
    self.goalId += 1;

    // Create goal element and append it to view
    const $newGoal = this.createNewGoal(newGoal).appendTo(self.$goalsView);

    self.updateGoalsCounter();

    return $newGoal;
  };

  /**
   * Remove chosen goal from the page
   * @param {jQuery} $goalContainer
   */
  GoalsPage.prototype.removeGoal = function ($goalContainer) {
    const goalInstance = this.getGoalInstanceFromUniqueId($goalContainer.data('uniqueId'));

    if (this.goalList.indexOf(goalInstance) > -1) {
      this.goalList.splice(this.goalList.indexOf(goalInstance), 1);
    }
    $goalContainer.remove();
    this.updateGoalsCounter();
    this.trigger('resize');
  };

  /**
   * Updates goal counter on page with amount of chosen goals.
   */
  GoalsPage.prototype.updateGoalsCounter = function () {
    const self = this;
    const $goalCounterContainer = $('.goals-counter', self.$inner);
    $goalCounterContainer.children().remove();
    if (self.goalList.length) {
      $('<span>', {
        class: 'goals-counter-text',
        html: `${self.params.goalsAddedText} ${self.goalList.length}`,
        'aria-live': 'polite',
      }).appendTo($goalCounterContainer);
    }
  };

  /**
   * Returns the goal instance matching provided id
   * @param {Number} goalInstanceUniqueId Id matching unique id of target goal
   * @returns {H5P.GoalsPage.GoalInstance|Number} Returns matching goal instance or -1 if not found
   */
  GoalsPage.prototype.getGoalInstanceFromUniqueId = function (goalInstanceUniqueId) {
    let foundInstance = -1;
    this.goalList.forEach((goalInstance) => {
      if (goalInstance.getUniqueId() === goalInstanceUniqueId) {
        foundInstance = goalInstance;
      }
    });

    return foundInstance;
  };

  /**
   * Create a new goal container
   * @param {H5P.GoalsPage.GoalInstance} goalInstance Goal instance object to create the goal from
   * @returns {jQuery} New goal element
   */
  GoalsPage.prototype.createNewGoal = function (goalInstance) {
    const self = this;

    // Goal container
    const $goalContainer = $('<div/>', {
      class: 'created-goal-container',
    }).data('uniqueId', goalInstance.getUniqueId());

    const id = `created-goal-${goalCounter}-${goalInstance.getUniqueId()}`;

    // Input paragraph area
    const $goalInputArea = $('<textarea>', {
      class: 'created-goal',
      spellcheck: 'false',
      placeholder: goalInstance.getGoalPlaceholder(),
      text: goalInstance.goalText(),
      title: goalInstance.getGoalTypeDescription(),
      id,
    }).appendTo($goalContainer);

    // Need to tell world I might need to resize
    $goalInputArea.on('blur keyup paste input', () => {
      self.trigger('resize');
    });

    // Save the value
    $goalInputArea.on('blur', () => {
      goalInstance.goalText($goalInputArea.val());
      const xAPIEvent = self.createXAPIEventTemplate('interacted');
      self.addQuestionToxAPI(xAPIEvent);
      self.addResponseToxAPI(xAPIEvent);
      self.trigger(xAPIEvent);
    });

    autoResizeTextarea($goalInputArea);

    // Add remove button
    this.createRemoveGoalButton(this.params.removeGoalText, id, $goalContainer).appendTo($goalContainer);

    return $goalContainer;
  };

  /**
   * Creates a button for removing the given container
   * @param {String} text String to display on the button
   * @param {jQuery} $removeContainer Container that will be removed upon click
   * @returns {jQuery} $removeGoalButton The button
   */
  GoalsPage.prototype.createRemoveGoalButton = function (text, textAreaId, $removeContainer) {
    const self = this;
    const $removeGoalButton = $('<button>', {
      class: 'h5p-created-goal-remove h5p-goals-button',
      'aria-label': text,
      click() {
        const confirmationDialog = new H5P.ConfirmationDialog({
          headerText: self.params.goalDeletionConfirmation.header,
          dialogText: self.params.goalDeletionConfirmation.message,
          cancelText: self.params.goalDeletionConfirmation.cancelLabel,
          confirmText: self.params.goalDeletionConfirmation.confirmLabel,
          theme: true,
        });

        confirmationDialog.on('confirmed', () => {
          self.removeGoal($removeContainer);
          // Set focus to add new goal button
          self.createGoalButton.focus();
        });
        confirmationDialog.appendTo(self.$inner.closest('.h5p-documentation-tool').get(0));
        confirmationDialog.show();
      },
    });
    H5P.Tooltip($removeGoalButton[0], { text });
    return $removeGoalButton;
  };

  /**
   * Get page title
   * @param {boolean} turncatedTitle turncate title flag
   * @returns {String} Page title
   */
  GoalsPage.prototype.getTitle = function (turncatedTitle = true) {
    const pageTitle = (this.extras && this.extras.metadata && this.extras.metadata.title) ? this.extras.metadata.title : 'Goals';
    return turncatedTitle ? H5P.createTitle(pageTitle) : pageTitle;
  };

  /**
   * Get goal list
   * @returns {Array} Goal list
   */
  GoalsPage.prototype.getGoals = function () {
    return this.goalList;
  };

  /**
   * Sets focus on page
   */
  GoalsPage.prototype.focus = function () {
    this.$pageTitle.focus();
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  GoalsPage.prototype.getXAPIData = function () {
    const XAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToxAPI(XAPIEvent);
    this.addResponseToxAPI(XAPIEvent);
    return {
      statement: XAPIEvent.data.statement,
    };
  };

  /**
    * Trigger xAPI answered event
    */
  GoalsPage.prototype.triggerAnswered = function () {
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   * Add the question itself to the definition part of an xAPIEvent
   */
  GoalsPage.prototype.addQuestionToxAPI = function (xAPIEvent) {
    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    $.extend(definition, this.getxAPIDefinition());
  };

  /**
   * Generate xAPI object definition used in xAPI statements.
   * @return {Object}
   */
  GoalsPage.prototype.getxAPIDefinition = function () {
    const definition = {};
    const self = this;
    definition.description = {
      'en-US': self.params.definedGoalLabel,
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'fill-in';
    definition.correctResponsesPattern = [];
    definition.extensions = {
      'https://h5p.org/x-api/h5p-machine-name': 'H5P.GoalsPage',
    };

    return definition;
  };

  /**
   * Add the response part to an xAPI event
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   */
  GoalsPage.prototype.addResponseToxAPI = function (xAPIEvent) {
    xAPIEvent.data.statement.result = {};
    xAPIEvent.data.statement.result.response = this.getXAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @return {string} User answers separated by the "[,]" pattern
   */
  GoalsPage.prototype.getXAPIResponse = function () {
    return this.getGoals().map((goal) => goal.text).join('[,]');
  };

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  GoalsPage.prototype.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    const div = document.createElement('div');
    div.innerHTML = dparser.documentElement.textContent;

    return div.textContent || div.innerText || '';
  };

  /**
   * Answer call to return the current state.
   * @return {object} Current state.
   */
  GoalsPage.prototype.getCurrentState = function () {
    const goals = this.goalList.map((instance) => ((typeof instance.getCurrentState === 'function')
      ? instance.getCurrentState()
      : undefined));

    return {
      goals,
    };
  };

  GoalsPage.prototype.resetTask = function () {
    const self = this;

    $(this.$goalsView).find('.created-goal-container').each(function () {
      self.removeGoal($(this));
    });
  };

  return GoalsPage;
}(H5P.jQuery, H5P.EventDispatcher));
