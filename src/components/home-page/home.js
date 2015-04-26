define(["knockout", "komapping", "jquery", "text!./home.html"], function(ko, komapping, $, homeTemplate) {
  'use strict';
  ko.mapping = komapping;
  function HomeViewModel(route) {
    this.INVALID = -1;
    this.DUBIUOS = 0;
    this.VALID = 1;
    this.limit = 0;
    this.totalTravellers = ko.observable(1);
    this.numberOfLitres = ko.observable(0);
    this.totalAmount = ko.observable(0);
    this.restAmount = ko.observable(0);
    this.valid = ko.observable(this.DUBIUOS);
    this.previousValid = this.DUBIUOS;
    this.addedClassName = 'added';
    this.formats = ko.observableArray();
    this.units = ko.observableArray();
    this.reglementations = ko.observableArray();
    this.ranges = ko.observableArray();
    this.amounts = ko.observableArray([]);
    this.initialize();
  }

  HomeViewModel.prototype.initialize = function() {
    this.loadData();
  };

  HomeViewModel.prototype.findTotalAmount = function() {
    this.totalAmount(this.reglementations().max);
  };

  HomeViewModel.prototype.findRestAmount = function() {
    this.restAmount(this.totalAmount() - this.numberOfLitres());
  };

  HomeViewModel.prototype.loadData = function() {
    var that = this;
    $.getJSON('data/reglementations.json', function(jsondata) {
      that.reglementations(ko.mapping.toJS(jsondata.reglementations));
      that.ranges(ko.mapping.toJS(jsondata.ranges));
      that.amounts(ko.mapping.toJS(jsondata.amounts));
      that.findTotalAmount();
      that.findRestAmount();
    });

    $.getJSON('data/formatsAndUnits.json', function(jsondata) {
      var data = jsondata.formats;
      for(var i in data) {
        data[i].addedNumber = 0;
      }
      that.formats(ko.mapping.fromJS(data));

      that.units(ko.mapping.fromJS(jsondata.units));
      that.loadLocalStorage();
    });
  };

  HomeViewModel.prototype.loadLocalStorage = function() {
    if(this.supports_localstorage()) {
      var storedNumberOfLitres = localStorage['numberOfLitres'],
      storedTotalTravellers = localStorage['totalTravellers'],
      storedRestAmount = localStorage['restAmount'];
      if(typeof storedRestAmount !== 'undefined') {
        this.restAmount(Number(storedRestAmount));
      }
      if(typeof storedNumberOfLitres !== 'undefined') {
        this.numberOfLitres(Number(storedNumberOfLitres));
      }
      if(typeof storedTotalTravellers !== 'undefined') {
        this.totalTravellers(Number(storedTotalTravellers));
      }
      var addedClassName = this.addedClassName;
      for(var i in this.formats()()) {
        var currentItem = this.formats()()[i],
        itemKey = currentItem.className() + '_' + addedClassName;
        if(typeof localStorage[itemKey] !== 'undefined') {
          currentItem.addedNumber(Number(localStorage[itemKey]));
        }
      }
    }
  };

  HomeViewModel.prototype.reset = function() {
    this.numberOfLitres(this.limit);
    this.restAmount(this.reglementations().max);
    this.totalTravellers(this.VALID);
    this.loadData();

    if(this.supports_localstorage()) {
      localStorage['numberOfLitres'] = this.limit;
      localStorage['totalTravellers'] = this.VALID;
      localStorage['restAmount'] = this.reglementations().max;
      var addedClassName = this.addedClassName;
      for(var key in localStorage) {
        var position = key.indexOf('_' + addedClassName);
        if(position > -1) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  HomeViewModel.prototype.supports_localstorage = function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  };

  HomeViewModel.prototype.addTraveller = function() {
    var newNumberOfTravellers = this.totalTravellers() +1;

    this.totalTravellers(newNumberOfTravellers);

    if(this.supports_localstorage()) {
      localStorage['totalTravellers'] = newNumberOfTravellers;
    }
  };

  HomeViewModel.prototype.subtractTraveller = function() {
    var currentNumberOfTravellers = this.totalTravellers(),
    newNumberOfTravellers = currentNumberOfTravellers -1;

    if(currentNumberOfTravellers > 1) {
      this.totalTravellers(newNumberOfTravellers);
      if(this.supports_localstorage()) {
        localStorage['totalTravellers'] = newNumberOfTravellers;
      }
    }
  };

  HomeViewModel.prototype.increaseAddedNumber = function(self, format) {
    var change = +1;
    self.updateAdded(change, this);
  };

  HomeViewModel.prototype.decreaseAddedNumber = function(self, format) {
    var change = -1;
    self.updateAdded(change, this);
  };

  HomeViewModel.prototype.updateAdded = function(change, formatObject) {
    var newValue = formatObject.addedNumber() + change,
    addedNumberOfLitres = change * formatObject.size(),
    localStorageKey = formatObject.className() + '_' + this.addedClassName;

    if(this.validNumberOfLiters(addedNumberOfLitres)) {
      formatObject.addedNumber(newValue);
      this.updateTotal(addedNumberOfLitres);

      if(this.supports_localstorage()) {
        localStorage[localStorageKey] = newValue;
      }
    }
  };

  HomeViewModel.prototype.updateTotal = function(addedNumberOfLitres) {
    var currentNumberOfLitres = this.numberOfLitres(),
    newNumberOfLitres = currentNumberOfLitres + addedNumberOfLitres;

      this.numberOfLitres(newNumberOfLitres);
      this.findRestAmount(newNumberOfLitres);

      if(this.supports_localstorage()) {
        localStorage['numberOfLitres'] = newNumberOfLitres;
        localStorage['restAmount'] = this.restAmount();
      }
  };

  HomeViewModel.prototype.validNumberOfLiters = function(addedNumberOfLitres) {
    var newNumberOfLitres = this.numberOfLitres() + addedNumberOfLitres;
    if(newNumberOfLitres >= this.limit) {
      return true;
    } else {
      return false;
    }
  };

  return { viewModel: HomeViewModel, template: homeTemplate };

});
