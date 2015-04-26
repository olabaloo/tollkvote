define(["knockout", "komapping", "localstorage", "jquery", "text!./home.html"], function(ko, komapping, localstorage, $, homeTemplate) {
  'use strict';
  ko.mapping = komapping;
  function HomeViewModel(route) {
    this.initial_travellers = 1;
    this.initial_numberOfLitres = 0;
    this.initial_totalAmount = 0;
    this.initial_restAmount = 0;
    this.totalTravellers = 
    ko.observable(this.initial_travellers, { persist: 'totalTravellers'});
    this.numberOfLitres = 
    ko.observable(this.initial_numberOfLitres, { persist: 'numberOfLitres'});
    this.totalAmount = ko.observable(this.initial_totalAmount);
    this.restAmount =  
    ko.observable(this.initial_restAmount, { persist: 'restAmount'});
    this.addedClassName = 'added';
    this.formats = ko.observableArray();
    this.units = ko.observableArray();
    this.reglementations = ko.observableArray();
    this.ranges = ko.observableArray();
    this.amounts = ko.observableArray();
    this.loadData();
  }

  HomeViewModel.prototype.updateData = function() {
    this.findTotalAmount();
    this.findRestAmount();
  };

  HomeViewModel.prototype.findTotalAmount = function() {
    var totalAmount, initial_ranges_subsidedAmount = 0, inital_amounts_beerAmount = 0;
    var initial_beerAmount = this.reglementations().beer.initialAmount,
    allPersons_beerAmount = initial_beerAmount * this.totalTravellers();

    for(var i in this.ranges()) {
      initial_ranges_subsidedAmount = 
      initial_ranges_subsidedAmount + 
      this.ranges()[i].commonAmount;
    }
    var allPersons_ranges_subsidedAmount = 
    initial_ranges_subsidedAmount * this.totalTravellers();

    for(var i in this.amounts()) {
      inital_amounts_beerAmount = 
      inital_amounts_beerAmount + 
      this.amounts()[i].beerAmount;
    }
    var allPersons_amounts_beerAmount = 
    inital_amounts_beerAmount * this.totalTravellers();

    totalAmount = 
    allPersons_beerAmount + 
    allPersons_ranges_subsidedAmount + 
    allPersons_amounts_beerAmount;

    this.totalAmount(totalAmount);
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
      that.updateData();
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
    this.numberOfLitres(this.initial_numberOfLitres);
    this.restAmount(this.initial_restAmount);
    this.totalTravellers(this.initial_travellers);
    this.loadData();

    if(this.supports_localstorage()) {
      var addedClassName = this.addedClassName;
      for(var key in localStorage) {
        var position = key.indexOf('_' + addedClassName);
        if(position > -1) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  HomeViewModel.prototype.addTraveller = function() {
    var newNumberOfTravellers = this.totalTravellers() +1;

    this.totalTravellers(newNumberOfTravellers);
    this.updateData();
  };

  HomeViewModel.prototype.subtractTraveller = function() {
    var currentNumberOfTravellers = this.totalTravellers(),
    newNumberOfTravellers = currentNumberOfTravellers -1;

    if(currentNumberOfTravellers > 1) {
      this.totalTravellers(newNumberOfTravellers);
      this.updateData();
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
    this.updateData();
  };

  HomeViewModel.prototype.validNumberOfLiters = function(addedNumberOfLitres) {
    var newNumberOfLitres = this.numberOfLitres() + addedNumberOfLitres;
    if(newNumberOfLitres >= this.initial_numberOfLitres) {
      return true;
    } else {
      return false;
    }
  };

  HomeViewModel.prototype.supports_localstorage = function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  };

  return { viewModel: HomeViewModel, template: homeTemplate };

});
