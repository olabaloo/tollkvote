define(["knockout", "jquery", "text!./home.html"], function(ko, $, homeTemplate) {
  'use strict';
  function HomeViewModel(route) {
    this.INVALID = -1;
    this.DUBIUOS = 0;
    this.VALID = 1;
    this.limit = 0;
    this.numberOfLitres = ko.observable(0);
    this.valid = ko.observable(this.DUBIUOS);
    this.previousValid = this.DUBIUOS;
    this.loadData();
    this.formats = ko.observableArray();
    this.units = ko.observableArray();
//    this.numberOfLitres.subscribe(this.validate());
}

HomeViewModel.prototype.loadData = function() {
  var that = this;
  $.getJSON('/data/data.json', function(jsondata) {
    that.formats(jsondata.formats);
    that.units(jsondata.units);
  });
};

HomeViewModel.prototype.add = function(binder) {
  this.updateTotal(binder.size);
  this.updateAdded(binder.className, +1);
};

HomeViewModel.prototype.subtract = function(binder) {
  this.updateTotal(-binder.size);
  this.updateAdded(binder.className, -1);
};

HomeViewModel.prototype.updateAdded = function(className, addition) {
  var currentElement = $('.' + className + ' .added'),
  currentValue = parseInt(currentElement.val()),
   newValue = currentValue + addition;
  currentElement.val(newValue);
  };

HomeViewModel.prototype.updateTotal = function(addition) {
  var newNumberOfLitres = this.numberOfLitres() + addition;
  this.numberOfLitres(newNumberOfLitres);
    //this.validate(0);
  };

  HomeViewModel.prototype.validate = function() {
    this.previousValid = this.valid();
    var currentNumberOfLitres = this.numberOfLitres();
    if(currentNumberOfLitres === this.limit) {
      this.valid(this.DUBIUOS);
    } else if(currentNumberOfLitres > this.limit) {
      this.valid(this.VALID);
    } else {
      this.valid(this.INVALID);
    }

    if(this.valid() === this.DUBIUOS) {
      console.log('Dubiuous.');
    } else if(this.valid() === this.INVALID && this.previousValid !== this.INVALID) {
      console.log('Invalid.');
    } else if(this.valid() === this.VALID && this.previousValid !== this.VALID) {
      console.log('Valid.');
    }
  };

  return { viewModel: HomeViewModel, template: homeTemplate };

});
