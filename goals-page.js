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
      title: '',
      description: '',
      chooseGoalText: 'Choose goal from list',
      defineGoalText: 'Create a new goal',
      defineGoalTitle: 'Create a new goal',
      defineGoalPlaceholder: 'Write here...',
      removeGoalTitle: 'Remove goal',
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
        '<div class="goals-description">{{description}}</div>'+
        '<div class="goals-define">'+
          '<a href="#" class="goals-predefined">{{chooseGoalText}}</a>'+
          '<a href="#" class="goals-create">{{defineGoalText}}</a>'+
        '</div>'+
        '<div class="goals-view"></div>';

    self.$inner.append(Mustache.render(goalsTemplate, self.params));


    var ndlaData = new NdlaGoals();

    //TODO: will be implemented in a later case.
    // Create predefined goal using GREP API (grep.ndla.no)
    $('.goals-predefined', self.$inner).click(function (event) {
/*      ndlaData.setDataCurriculum('uuid:2be0f347-d834-4e20-89a0-6f13bf10c0f9').getData();
      ndlaData.setDataAllCurricula().getData();*/
      event.preventDefault();
    });

    // Create new goal on click
    $('.goals-create', self.$inner).click( function (event) {
      var $newGoal = self.createNewGoal().appendTo($('.goals-view', self.$inner));
      $('.created-goal', $newGoal).focus();
      var newGoal = new Goal(self.params.defineGoalPlaceholder, self.goalId);
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

  GoalsPage.prototype.getGoals = function () {
    return this.goalList;
  };

  //TODO: Make NDLA external file, and only create button if external file is loaded.
  function NdlaGoals() {
    // default to all curricula
    this.setDataAllCurricula();
  }

  NdlaGoals.prototype.setDataAllCurricula = function () {
    this.service_data = {
      "method" : "get.curricula",
      "format" : "json",
      "language" : "nb"
    };

    return this;
  };

  /**
   * Set the data that will be retrieved to specified uuid
   *
   * @param {String} uuid uuid of curriculum
   * @returns {NdlaGoals} NdlaGoals Returns this for chaining.
   */
  NdlaGoals.prototype.setDataCurriculum = function (uuid) {
    var slicedUuid = uuid;
    if (uuid.substring(0,4) == "uuid") {
      slicedUuid = uuid.slice(4);
    }

    this.service_data = {
      "method" : "get.curriculum",
      "laereplan_id" : "uuid:"+slicedUuid,
      "format" : "json",
      "language" : "nb"
    };

    return this;
  };

  NdlaGoals.prototype.getData = function () {
    var self = this;
    var jsonData;
    $.ajax({
      url: "http://relate.ndla.no/services/json",
      dataType: "jsonp",
      data: self.service_data,
      jsonp: "callback",
      success: function(data){

        if (typeof(data["#error"]) !== 'undefined' && data["#error"] == false) {
          console.log(data["#data"]);
          jsonData = data["#data"];
          // yourfunction(data["#data"]);
        } else {
          // display error message
          throw new Error("Could not retrieve grep.ndla.no data");
        }
      },
      error: function(xhr, status, errorThrown) {
        alert("Cannot connect to the Internet.");
      }
    });

    // Test av mycurriculum test
/*    $.getJSON('http://mycurriculum.test.ndlap3.seria.net/v1/users/ndla/education-groups.json', function (data) {
      console.log(data);
      jsonData = data;
    });*/

    return jsonData;
  };

  function Goal(defineGoalPlaceholder, uniqueId) {
    this.uniqueId = uniqueId;
    this.answer = -1;
    this.text = defineGoalPlaceholder;
  }

  Goal.prototype.goalId = function() {
    return this.uniqueId;
  };

  Goal.prototype.goalAnswer = function (answer) {
    // Get answer value if no arguments
    if (answer === undefined) {
      return this.answer;
    }

    // Set answer value
    this.answer = answer;
    return this;
  };

  Goal.prototype.goalText = function (text) {
    // Get text value if no arguments
    if (text === undefined) {
      return this.text;
    }

    // Set text value
    this.text = text;
    return this;
  };

  return GoalsPage;
})(H5P.jQuery);