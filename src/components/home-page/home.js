define(["knockout", "komapping", "localstorage", "jquery", "text!./home.html"], function(ko, komapping, localstorage, $, homeTemplate) {
  'use strict';
  ko.mapping = komapping;
  function HomeViewModel(route) {
    this.initial_travellers = 1;
    this.initial_numberOfLitres = 0;
    this.initial_totalAmount = 0;
    this.initial_restAmount = 0;
    this.minimal_amount = 0;
    this.initial_subsidedAmount = 0;
    this.initial_subsidedRange = 0;
    this.totalTravellers = 
      ko.observable(this.initial_travellers, { persist: 'totalTravellers'});
    this.numberOfLitres = 
      ko.observable(this.initial_numberOfLitres, { persist: 'numberOfLitres'});
    this.totalAmount = ko.observable(this.initial_totalAmount);
    this.restAmount =  
      ko.observable(this.initial_restAmount, { persist: 'restAmount'});
    this.additionalAmount = ko.observable(0);
    this.addedClassName = 'added';
    this.rangeClassName = 'range';
    this.amountClassName = 'amount';
    this.formats = ko.observableArray();
    this.units = ko.observableArray();
    this.reglementations = ko.observableArray();
    this.ranges = ko.observableArray();
    this.amounts = ko.observableArray();
    this.notExceedsFreeQuota = ko.observable(true);
    this.exceedsFreeQuota = ko.observable(false);
    this.loadData();
    this.costOfDeclaration = ko.observable('kr 0,-');
  }

  HomeViewModel.prototype.updateData = function() {
    this.findTotalAmount();
    this.findRestAmount();
  };

  HomeViewModel.prototype.findcostOfDeclaration = function() {
    var costPrefix = this.reglementations().currencyReadablePrefix,
    costSuffix = this.reglementations().currencyReadableSuffix,
    numberOfLitres = this.additionalAmount(),
    sats = this.reglementations().costOfDeclarationPerUnit,
    costData = numberOfLitres * sats,
    formattedCost = '';

    costData = this.sanitizeNumber(costData, 0);
    formattedCost = costPrefix + costData + costSuffix;
    this.costOfDeclaration(formattedCost);
  };

  HomeViewModel.prototype.findTotalAmount = function() {
    var initial_beerAmount = this.reglementations().beer.initialAmount,
    allPersons_beerAmount = initial_beerAmount * this.totalTravellers(),
    rangesArray = this.ranges()(),
    amountsArray = this.amounts()(),
    totalAmount;

    var ranges_subsides_available = 0,
      ranges_already_subsided = 0;
    for(var i in rangesArray) {
      var newRange = rangesArray[i].commonAmount();
      ranges_subsides_available = ranges_subsides_available + newRange;
      ranges_already_subsided = ranges_already_subsided + rangesArray[i].subsidedRange();
    }
    ranges_subsides_available = 
      ranges_subsides_available * this.totalTravellers()
      - ranges_already_subsided;

    var amounts_subsides_available = 0,
      amounts_already_subsided = 0;
    for(var i in amountsArray) {
      var newAmount = amountsArray[i].beerAmount();
      amounts_subsides_available = amounts_subsides_available + newAmount;
      amounts_already_subsided = amounts_already_subsided + (amountsArray[i].subsidedAmount() * amountsArray[i].beerAmount());
    }
    amounts_subsides_available = 
      amounts_subsides_available * this.totalTravellers()
      - amounts_already_subsided;

    totalAmount = 
      allPersons_beerAmount + 
      ranges_subsides_available + 
      amounts_subsides_available;
    this.totalAmount(totalAmount);
  };

  HomeViewModel.prototype.findRestAmount = function() {
    var restAmount = this.totalAmount() - this.numberOfLitres();
    restAmount = this.sanitizeNumber(restAmount, 3);
    this.restAmount(restAmount);
    this.additionalAmount(-this.restAmount())
    if(this.restAmount() >= 0) {
      this.notExceedsFreeQuota(true);
      this.exceedsFreeQuota(false);
    } else {
      this.notExceedsFreeQuota(false);
      this.exceedsFreeQuota(true);
      this.findcostOfDeclaration();
    }
  };

  HomeViewModel.prototype.loadData = function() {
    var that = this;
    $.getJSON('data/reglementations.json', function(jsondata) {
      that.reglementations(ko.mapping.toJS(jsondata.reglementations));
      
      var data = jsondata.ranges;
      for(var i in data) {
        data[i].subsidedRange = that.initial_subsidedRange;
      }
      that.ranges(ko.mapping.fromJS(data));

      data = jsondata.amounts;
      for(var i in data) {
        data[i].subsidedAmount = that.initial_subsidedAmount;
      }
      that.amounts(ko.mapping.fromJS(data));

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
        itemKey = addedClassName + '_' + currentItem.className();

        if(typeof localStorage[itemKey] !== 'undefined') {
          currentItem.addedNumber(Number(localStorage[itemKey]));
        }
      }

      var rangeClassName = this.rangeClassName;
      for(var i in this.ranges()()) {
        var currentItem = this.ranges()()[i],
        itemKey = rangeClassName + '_' + currentItem.className();

        if(typeof localStorage[itemKey] !== 'undefined') {
          currentItem.subsidedRange(Number(localStorage[itemKey]));
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
      var rangeClassName = this.rangeClassName,
        addedClassName = this.addedClassName;
      for(var key in localStorage) {
        var position = key.indexOf(addedClassName);
        if(position < 0) {
          position = key.indexOf(rangeClassName);
        }
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

    if(currentNumberOfTravellers > this.initial_travellers) {
      this.totalTravellers(newNumberOfTravellers);
      this.updateData();
    }
  };

  HomeViewModel.prototype.increaseRange = function(self, model) {
    var change = +0.05;
    self.updateRange(change, this);
  };

  HomeViewModel.prototype.decreaseRange = function(self, model) {
    var change = -0.05;
    self.updateRange(change, this);
  };

  HomeViewModel.prototype.sanitizeNumber = function(number, numberOfDecimals) {
    number = Number((number).toFixed(numberOfDecimals));
    return number;
  };

  HomeViewModel.prototype.updateRange = function(change, rangeObject) {
    var newAmount = rangeObject.subsidedRange() + change, 
    newAmount = this.sanitizeNumber(newAmount, 2),
    upperLimit = rangeObject.commonAmount(),
    localStorageKey = this.rangeClassName + '_' + rangeObject.className();

    if(this.validRangeOrAmount(newAmount, upperLimit)) {
      rangeObject.subsidedRange(newAmount);
      this.updateLocalStorage(localStorageKey, newAmount);
      this.updateData();
    }
  };

  HomeViewModel.prototype.increaseAmount = function(self, model) {
    var change = +1;
    self.updateAmount(change, this);
  };

  HomeViewModel.prototype.decreaseAmount = function(self, model) {
    var change = -1;
    self.updateAmount(change, this);
  };

  HomeViewModel.prototype.updateAmount = function(change, amountObject) {
    var newAmount = amountObject.subsidedAmount() + change,
    upperLimit = amountObject.originalAmount(),
    localStorageKey = this.rangeClassName + '_' + amountObject.className();
    if(this.validRangeOrAmount(newAmount, upperLimit)) {
      amountObject.subsidedAmount(newAmount);
      this.updateLocalStorage(localStorageKey, newAmount);
      this.updateData();
    }
  };

  HomeViewModel.prototype.validRangeOrAmount = function(newAmount, upperLimit) {
    if(newAmount >= this.minimal_amount && newAmount <= (upperLimit * this.totalTravellers())) {
      return true;
    } else {
      return false;
    }
  };

  HomeViewModel.prototype.increaseAddedNumber = function(self, model) {
    var change = +1;
    self.updateAdded(change, this);
  };

  HomeViewModel.prototype.decreaseAddedNumber = function(self, model) {
    var change = -1;
    self.updateAdded(change, this);
  };

  HomeViewModel.prototype.updateAdded = function(change, formatObject) {
    var newValue = formatObject.addedNumber() + change,
    addedNumberOfLitres = change * formatObject.size(),
    localStorageKey = this.addedClassName + '_' + formatObject.className();

    if(this.validNumberOfLiters(addedNumberOfLitres)) {
      formatObject.addedNumber(newValue);
      this.updateTotal(addedNumberOfLitres);
      this.updateLocalStorage(localStorageKey, newValue);
    }
  };

  HomeViewModel.prototype.updateTotal = function(addedNumberOfLitres) {
    var currentNumberOfLitres = this.numberOfLitres(),
    newNumberOfLitres = currentNumberOfLitres + addedNumberOfLitres;

    newNumberOfLitres = this.sanitizeNumber(newNumberOfLitres, 3);

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

  HomeViewModel.prototype.updateLocalStorage = function(localStorageKey, newValue) {
      if(this.supports_localstorage()) {
        localStorage[localStorageKey] = newValue;
      }
  }

  HomeViewModel.prototype.supports_localstorage = function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  };

  return { viewModel: HomeViewModel, template: homeTemplate };

});
